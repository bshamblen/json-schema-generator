(function() {
	// Base object, `window` in the browser, `exports` in node.
	var base = this;

	var ArrayOptions = {
		singleSchema: 'singleSchema',
		arraySchema: 'schemaArray',
		emptySchema: 'emptySchema'
	}

	var defaultOptions = {
		url: 'http://example.com',
		json: {},
		// Array options.
		arrayOptions: ArrayOptions.singleSchema,
		// General options.
		includeDefaults: false,
		includeEnums: false,
		forceRequired: true,
		absoluteIds: true,
		numericVerbose: false,
		stringsVerbose: false,
		objectsVerbose: false,
		arraysVerbose: false,
		metadataKeywords: false,
		additionalItems: true,
		additionalProperties: true
	}

	function mergeOptions (obj1, obj2) {
		var obj3 = {};
		for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
		for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
		return obj3;
	}

	/**
	* Utility class
	*/
	var Utility = {
		isDateString: function(value) {
			var regEx = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
			return regEx.test(value);
		},
		isEmailString: function(value) {
			var regEx = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
			return regEx.test(value);
		},
		getType: function(value) {
			var type = undefined;

			if (Array.isArray(value)) {
				type = 'array';
			} else if (null === value) {
				type = 'null';
			} else if (typeof value === 'object') {
				type = 'object';
			} else if (typeof value === 'string') {
				type = 'string';
			} else if (typeof value === 'boolean') {
				type = 'boolean';
			} else if (!isNaN(value)) {
				if (Math.floor(value) === value) {
					type = 'integer';
				} else {
					type = 'number';
				}
			}

			return type;
		},
		getFormat: function(value) {
			var format = undefined;

			if (typeof value === 'string') {
				if (this.isDateString(value)) {
					format = 'date-time';
				} else if (this.isEmailString(value)) {
					format = 'email';
				}
			}

			return format;
		},
		getEmptySchema: function(options) {
			var schema = {};
			var key = 'sub-schema-' + Math.floor((Math.random() * 1000) + 1);

			schema.__key__ = key;
			schema.id = key;

			if (options.metadataKeywords) {
				schema.title = String(key)[0].toUpperCase() + String(key).slice(1) + ' schema.';
				schema.description = 'An explanation about the purpose of this instance described by this schema.';
				schema.name = String(key);
			}

			return schema;
		}
	}

	/**
	* Schema class
	*/
	var Schema = function(key, value, options) {
		var isPrimitiveType = (
			(!Array.isArray(value) && (typeof value !== 'object'))
		);

		this.root = !key;
		key = String(key);
		this.key = this.root ? '/' : key;
		this.id = this.root ? options.url : key;
		this.type = Utility.getType(value);
		this.format = Utility.getFormat(value);
		this.title = this.root ? 'Root Schema.' : key[0].toUpperCase() + key.slice(1) + ' schema.';
		this.description = 'An explanation about the puropose of this instance described by this schema.';
		this.name = this.key;

		if (isPrimitiveType) {
			this.defaultValue = value;
		}

		this.subSchemas = [];
	}

	Schema.prototype.addSubSchema = function(schema) {
		schema.parent = this;
		this.subSchemas.push(schema);
	}

	Schema.prototype.isObject = function() {
		return this.type === 'object';
	}

	Schema.prototype.isArray = function() {
		return this.type === 'array';
	}

	Schema.prototype.isString = function() {
		return this.type === 'string';
	}

	Schema.prototype.isNumber = function() {
		return this.type === 'number';
	}

	Schema.prototype.isInteger = function() {
		return this.type === 'integer';
	}

	/**
	* Schema generator class
	*/
	var SchemaGenerator = function(options) {
		var self = this;
		this.options = mergeOptions(defaultOptions, options || {});
		this.json = {};
		this.intermediateResult = null;
		this.editableSchema = {};
		this.schema = {};

		this.json2Schema = function() {
			this.jsonString2EditableSchema();
			this.editableSchema2FinalSchema();
		}

		this.jsonString2EditableSchema = function() {
			try {
				if (typeof self.options.json === 'object') {
					self.json = self.options.json
				} else {
					self.json = JSON.parse(self.options.json);
				}
				self.intermediateResult = self.schema4Object(undefined, self.json);
				self.editableSchema = self.constructSchema(self.intermediateResult);
			} catch (err) {
				console.log(err);
			}
		}

		this.editableSchema2FinalSchema = function() {
			self.schema = JSON.parse(JSON.stringify(self.editableSchema));
			self.clean(self.schema);
		}

		this.clean = function(obj) {
			var key = obj['__key__'];

			for (var k in obj) {
				if (typeof obj[k] === 'object' && obj[k] !== null) {
					if (obj[k].__removed__) {
						delete obj[k];
						continue;
					}
					// Recursive call parsing in parent object this time.
					this.clean(obj[k]);
				} else {
					switch (String(k)) {
						/*
						Metadata keywords.
						*/
						case '__required__':
							var required = obj[k];
							var s = self.getSchema(obj.__parent__);

							if (!s) {
								break;
							}
							if (required) {
								if (!s.required) {
									s.required = [];
								}
								s.required.push(key);
							} else {
								if (s.required) {
									var index = s.required.indexOf(key);
									if (index > -1) {
										s.required.splice(index, 1);
									}
								}
							}

							break;
						case '__removed__':
							break;
						/*
						Keywords for arrays.
						*/
						case 'maxItems':
						case 'minItems':
							break;
						case 'uniqueItems':
							var val = Boolean(obj[k]);
							obj[k] = val;
							if (!self.options.arraysVerbose) {
								if (!val) {
									delete obj[k];
								}
							}
							break;
						case 'additionalItems':
							var val = Boolean(obj[k]);
							obj[k] = val;
							if (!self.options.arraysVerbose) {
								if (val) {
									// true is default
									delete obj[k];
								}
							}
							break;
						/*
						Keywords for numeric instances (number and
						integer).
						*/
						case 'minimum':
						case 'maximum':
						case 'multipleOf':
							var val = parseInt(obj[k]);
							obj[k] = val;
							if (!self.options.numericVerbose) {
								// Only delete if defaut value.
								if (!val && val != 0) {
									delete obj[k];
								}
							}
							break;
						case 'exclusiveMinimum':
						case 'exclusiveMaximum':
							var val = Boolean(obj[k]);
							obj[k] = val;
							if (!self.options.numericVerbose) {
								if (!val) {
									delete obj[k];
								}
							}
							break;
						/*
						Metadata keywords.
						*/
						case 'name':
						case 'title':
						case 'description':
							var val = String(obj[k]).trim();
							obj[k] = val;
							if (!self.options.metadataKeywords) {
								if (!val) {
									delete obj[k];
								}
							}
							break;
						/*
						Keywords for objects.
						*/
						case 'additionalProperties':
							var val = Boolean(obj[k]);
							obj[k] = val;
							if (!self.options.objectsVerbose) {
								if (val) {
									// true is default
									delete obj[k];
								}
							}
							break;
					}

					// General logic.
					// Remove __meta data__ from Code schema, but don't change
					// editable schema.
					var metaKey = k.match(/^__.*__$/g);

					if (metaKey) {
						delete obj[k];
					}
				}
			}
		}

		this.schema4Object = function(key, value) {
			var schema = new Schema(key, value, self.options);

			if (value) {
				var keys = Object.keys(value);

				for (var index = 0; index < keys.length; index++) {
					var oKey = keys[index];
					var oValue = value[oKey];
					var subSchema = null;

					if (Array.isArray(oValue) || typeof oValue === 'object') {
						// object, array
						subSchema = self.schema4Object(oKey, oValue);
					} else {
						// number, integer, string, null, boolean
						subSchema = new Schema(oKey, oValue, self.options);
					}

					// This also sets the subSchema parent to schema.
					schema.addSubSchema(subSchema);
				}
			}

			return schema;
		}

		this.makeVerbose = function(src, dst) {
			switch (src.type) {
				case 'array':
					if (self.options.arraysVerbose) {
						dst.minItems = 1;
						dst.uniqueItems = false;
						dst.additionalItems = self.options.additionalItems;
					}
					break;
				case 'object':
					if (self.options.objectsVerbose) {
						dst.additionalProperties = true;
					}
					break;
				case 'integer':
				case 'number':
					if (self.options.numericVerbose) {
						dst.multipleOf = 1;
						dst.maximum = 100;
						dst.minimum = 1;
						dst.exclusiveMaximum = false;
						dst.exclusiveMinimum = false;
					}
					break;
				case 'string':
					if (self.options.stringsVerbose) {
						dst.minLength = 1;
					}
				case 'boolean':
				case 'null':
					break;
			}

			// Metadata keywords apply to all types.
			if (self.options.metadataKeywords) {
				dst.title = src.title;
				dst.description = src.description;
				dst.name = src.name;
			}
		}

		this.initObject = function(src, dst) {
			if (src.isObject()) {
				dst.properties = {};

				if (!self.options.additionalProperties) {
					// false is not default, so always show.
					dst.additionalProperties = false;
				} else {
					// true is default, only show if objects are verbose.
					if (self.options.objectsVerbose) {
						dst.additionalProperties = true;
					}
				}
			}
		}

		this.initArray = function(src, dst) {
			if (src.isArray()) {
				switch (self.options.arrayOptions) {
					case ArrayOptions.emptySchema:
					case ArrayOptions.singleSchema:
						dst.items = {};
						break;
					case ArrayOptions.arraySchema:
						dst.items = [];
						break;
				}

				if (!self.options.additionalItems) {
					// false is not default, so always show.
					dst.additionalItems = false;
				} else {
					// true is default, only show if objects are verbose.
					if (self.options.arraysVerbose) {
						dst.additionalItems = true;
					}
				}
			}
		}

		this.addDefault = function(src, dst) {
			if (self.options.includeDefaults) {
				if (!src.isObject() && !src.isArray()) {
					// Only primitive types have default values.
					dst.default = src.defaultValue;
				}
			}
		}

		this.addEnums = function(src, dst) {
			if (self.options.includeEnums) {
				if (!src.isObject() && !src.isArray()) {
					// Only primitive types have enums.
					dst.enum = [null];

					if (src.defaultValue) {
						dst.enum.push(src.defaultValue);
					}
				}
			}
		}

		this.addRequired = function(src, dst) {
			dst.__required__ = self.options.forceRequired;
		}

		this.setType = function(src, dst) {
			dst.type = src.type;
		}

		this.setFormat = function(src, dst) {

			if (src.format) {
				dst.format = src.format;
			}
		}

		this.constructId = function(src, dst) {
			if (self.options.absoluteIds) {
				if (src.root) {
					dst.id = self.options.url;
				} else {
					/*
					First time round, this will the child of root and will
					be: (http://jsonschema.net + '/' + address)
					*/
					var asboluteId = (src.parent.id + '/' + src.id);
					dst.id = asboluteId;

					// We MUST set the parent ID to the ABSOLUTE URL
					// so when the child builds upon it, it too is an
					// absolute URL.
					/*
					The current object will be a parent later on. By setting
					src.id now, any children of this object will call
					src.parent.id when constructing the absolute ID.
					*/
					src.id = asboluteId;
				}
			} else {
				// Relative IDs
				if (src.root) {
					dst.id = '/';
				} else {
					dst.id = src.id;
				}
			}

			dst.__key__ = src.key;
		}

		this.setSchemaRef = function(src, dst) {
			if (src.root) {
				// Explicitly declare this JSON as JSON schema.
				dst._$schema = 'http://json-schema.org/draft-04/schema#';
				dst.__root__ = true;
			}
		}

		this.constructSchema = function(intermediateSchema) {
			var schema = {};

			/*
			Set as many values as possible now.
			*/
			self.setSchemaRef(intermediateSchema, schema);
			self.constructId(intermediateSchema, schema);
			self.setType(intermediateSchema, schema);
			self.setFormat(intermediateSchema, schema);
			self.makeVerbose(intermediateSchema, schema);
			self.addDefault(intermediateSchema, schema);
			self.addEnums(intermediateSchema, schema);
			self.addRequired(intermediateSchema, schema);

			/*
			Subschemas last.
			Don't actually add any properties or items, just initialize
			the object properties so properties and items may be added.
			*/
			self.initObject(intermediateSchema, schema);
			self.initArray(intermediateSchema, schema);

			// Schemas with no sub-schemas will just skip this loop and
			// return the { } object.
			for (var index = 0; index < intermediateSchema.subSchemas.length; index++) {
				var value = intermediateSchema.subSchemas[index];

				// Each sub-schema will need its own {} schema object.
				var subSchema = self.constructSchema(value);
				subSchema.__parent__ = schema.id;

				if (intermediateSchema.isObject()) {
					schema.properties[value.key] = subSchema;
				} else if (intermediateSchema.isArray()) {
					// TODO: Move to this.initItems()
					switch (self.options.arrayOptions) {
						case ArrayOptions.emptySchema:
							schema.items = Utility.getEmptySchema(self.options);
							break;
						case ArrayOptions.singleSchema:
							schema.items = subSchema;
							break;
						case ArrayOptions.arraySchema:
							//  Use array of schemas, however, still may only be one.
							if (intermediateSchema.subSchemas.length > 1) {
								schema.items.push(subSchema);
							} else {
								schema.items = subSchema;
							}
							break;
						default:
							break;
					}
				}
			}

			return schema;
		}

		this.removeSchemaById = function(obj, id) {
			for (var k in obj) {
				if (typeof obj[k] === 'object' && obj[k] !== null) {
					self.removeSchemaById(obj[k], id);
				}

				switch (String(k)) {
					case 'id':
						if (obj[k] === id) {
							obj.__removed__ = true;
						}
				}
			}
		}

		this.getSchemaById = function(obj, id) {
			for (var k in obj) {
				if (typeof obj[k] === 'object' && obj[k] !== null) {
					self.getSchemaById(obj[k], id);
				}

				switch (String(k)) {
					case 'id':
						if (obj[k] == id) {
							return obj;
						}
				}
			}
		}

		this.removeSchema = function(id) {
			self.removeSchemaById(self.editableSchema, id);
		}

		this.getSchema = function(id) {
			if (!id) {
				return self.schema;
			} else {
				return self.getSchemaById(self.editableSchema, id);
			}
		}

		this.getEditableSchema = function() {
			return self.editableSchema;
		}

		this.formatJSON = function(json) {
			// Format user's JSON just to be nice :)
			return JSON.stringify(JSON.parse(json), null, 2);
		}

		this.getFormattedJSON = function() {
			// Format user's JSON just to be nice :)
			return JSON.stringify(self.json, null, 2);
		}

		this.getSchemaAsString = function(format) {
			this.editableSchema2FinalSchema();
			var str = JSON.stringify(self.schema, null, format ? 2 : null);
			str = str.replace('_$', '$');
			return str;
		}

		this.json2Schema();
	}

	SchemaGenerator.isValidJSON = function(json) {
		try {
			JSON.parse(json);
		} catch (err) {
			return false;
		}

		return true;
	}

	SchemaGenerator.ArrayOptions = ArrayOptions;

	if (typeof Package !== 'undefined') {
		JSONSchemaGenerator = SchemaGenerator;
	} else if (typeof define === 'function' && define.amd) {
		define('JSONSchemaGenerator', [], function() {
			return SchemaGenerator;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = SchemaGenerator;
	} else {
		base.JSONSchemaGenerator = SchemaGenerator;
	}
}.call(this));
