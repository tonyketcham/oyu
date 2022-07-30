export interface GqlType {
	kind: string;
	name: string;
}

export interface GqlField {
	name: string;
	description?: string;
	type: GqlType & { ofType?: GqlType };
}

export interface GqlSchema {
	name: string;
	pluralName: string;
	description?: string;
	kind: string;
	fields: GqlField[];
}

export interface Field {
	label: string;
	name: string;
	type: GqlField['type'];
	description?: string;
	disabled?: boolean;
	component: string;
	collection?: string;
}

export interface GqlQueryCollection extends GqlField {
	schema: GqlSchema;
	label?: string;
}
