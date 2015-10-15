Package.describe({
	name: 'bshamblen:json-schema-generator',
	version: '0.0.1',
	summary: 'Converts a JSON document to a JSON Schema.',
	git: 'https://github.com/Yodata/json-schema-generator.git',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.export(['JSONSchemaGenerator'], ['client', 'server']);
	api.addFiles(['./src/json-schema-generator.js']);
});
