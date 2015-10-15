##JSON Schema Generator
Generates a JSON-schema from a JSON document, or object. This is not intended to be bulletproof, since many of the attributes of the schema's properties are inferred from the data provided in the JSON document. It simply parses a JSON string and creates a best-guess representation of the JSON schema from the document.

### Attribution
This library is based on the [jsonschema/json-schema-v2](https://github.com/jsonschema/json-schema-v2) project (originally written for angular). This port is designed to work in any JavaScript based environment (web browsers, node.js, angular.js, Meteor...).

### Web Browser
There are no prerequisites for this library.

The following file is located in the `src` folder of this repository:

```html
<script src="json-schema-generator.js"></script>
```

```javascript
//sample JSON string. Could also be populated from a textarea or file.
var jsonString = '{"test" : "this"}';

//create a new instance of the JSON Schema Generator
var generator = new JSONSchemaGenerator({
	url: 'http://example.com',
	json: jsonString
});

//get the schema object
var schemaObj = generator.getSchema();

//get the formatted schema string.
var schemaString = generator.getSchemaAsString(true);
```

### Options
Options are passed to the `JSONSchemaGenerator` contructor as object properties.

| option | description | default |
|:-------|:------------|:--------|
| json   | The JSON string or JSON object to be used when generating the JSON schema. | `{}` |
| url    | The base URL for each property's `id`. *Should not contain a trailing slash.* | `http://example.com` |
| arrayOptions | Indicates how you'd like the schemas for array values to be represented. See "ArrayOptions" below for more information. | `singleSchema` |
| includeDefaults | Indicates whether or not you'd like to use the values from your JSON document as the default values in your schema. | `false` |
| includeEnums | Similar to `includeDefault` this option will use the values from the JSON document to define an email for every property, allowing only `null` and the value from the JSON document. You'll need to manually delete/modify the enums, based on your requirements. | `false` |
| forceRequired | Adds a block of `required` properties at the bottom of the schema. All properties will be included. You'll need to reduce the list, based on your requirements. | `true` |
| absoluteIds | Prepends the `url` value to the beginning each property `id` value. | `true` |
| numericVerbose | Includes `multipleOf`, `minimum`, `maximum`, `exclusiveMinimum`, and `exclusiveMaximim` attriibutes for every property with a `type` of `numeric`. Attribute values will most likely need to be adjusted, based on your requirements. | `false` |
| stringsVerbose | Includes the `minLength` attribute to every property with a `type` of `string`. Attribute values will most likely need to be adjusted, based on your requirements. | `false` |
| objectsVerbose | Includes the `"additionalProperties": true` attribute to every property with a `type` of `object`. Attribute values may need to be adjusted, based on your requirements.| `false` |
| arraysVerbose | Includes `minItems`, `uniqueItems`, and `additionalItems` atttibutes for every property with a `type` of `array`. Attribute values will most likely need to be adjusted, baed on your requirements. | `false` |
| metadataKeywords | Includes `title`, `description`, and `name` attributes for every property, with default text. The attributes will need to be modified to document each of the properties. | `false` |
| additionalItems | If set to `false`, includes the `"additionalItems": false` attribute for every property with a `type` of `array`. | `true` |
| additionalProperties |  If set to `false`, includes the `"additionalProperties": false` attribute for every property with a `type` of `object`. | `true` |


### Contributions

Contributions are greatly appreciated. Please submit an issue first, to discuss the changes you intend to make, before submitting a pull request. 