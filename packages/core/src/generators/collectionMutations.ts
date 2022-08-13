import { ObjectTypeComposer, SchemaComposer } from 'graphql-compose';
import { get, merge } from 'lodash-es';
import { CollectionContext, CollectionResolverArgs, EntryNode } from '../types';

export default function addCollectionMutations(
  schemaComposer: SchemaComposer,
  args: CollectionResolverArgs
) {
  const { name, objectTypeComposer, updateCollectionRecord, collectionEntry } =
    args;

  async function update(
    payload: Record<string, EntryNode>,
    existing: EntryNode
  ) {
    // remove _metadata to prevent injection
    const { _metadata, ...update } = payload?.[name];

    const targetRecord = objectTypeComposer
      .getResolver('findById')
      .resolve({ args: update });

    // remove supplied key (might not be required)
    delete update[targetRecord._metadata.referenceField];
    const newRecord = merge(targetRecord, update);

    await updateCollectionRecord(collectionEntry, newRecord);

    return newRecord;
  }

  async function create(source: unknown, payload: Record<string, EntryNode>) {
    collectionEntry.creationRequiredFields.forEach((field) => {
      if (!payload[name].hasOwnProperty(field))
        throw new Error(
          `field ${field} is required when creating a new ${name}`
        );
    });

    const record = merge(payload[name], {
      _metadata: {
        referenceField: collectionEntry.referenceField ?? 'id',
        collection: name,
        transformedBy: collectionEntry?.defaultTransformer,
        sourcedBy: collectionEntry?.defaultSource,
      } as CollectionContext,
    });

    return await updateCollectionRecord(collectionEntry, record);
  }

  schemaComposer.Mutation.addFields({
    [`update${name}`]: {
      type: objectTypeComposer,
      args: {
        [name]: objectTypeComposer
          .getInputTypeComposer()
          .makeFieldNonNull(collectionEntry.creationRequiredFields),
      },
      description: `Update a ${name}`,
      async resolve(source: unknown, payload: Record<string, EntryNode>) {
        const { _metadata, ...args } = payload?.[name];

        const existingRecord = objectTypeComposer
          .getResolver('findById')
          .resolve({ args });

        if (!existingRecord)
          throw new Error(
            `${name} with ${collectionEntry.referenceField} of ${get(
              args,
              collectionEntry.referenceField
            )} not found`
          );
        return update(payload, existingRecord);
      },
    },
    [`create${name}`]: {
      type: objectTypeComposer,
      args: {
        [name]: objectTypeComposer
          .getInputTypeComposer()
          .clone(`${name}CreateInput`)
          .removeField('id')
          .makeFieldNonNull(collectionEntry.creationRequiredFields),
      },
      description: `Create a ${name}`,
      resolve: create,
    },
    [`upsert${name}`]: {
      type: objectTypeComposer,
      args: { [name]: objectTypeComposer.getInputTypeComposer() },
      async resolve(source: unknown, payload: Record<string, EntryNode>) {
        const { _metadata, ...args } = payload?.[name];

        const existingRecord = objectTypeComposer
          .getResolver('findById')
          .resolve({ args });

        if (existingRecord) return update(payload, existingRecord);
        create(source, payload);
      },
    },
  });
}