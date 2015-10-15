$(document).ready(function() {
	function convertJSON2Schema() {
		var json = $('#sourceJSON').val();

		if (JSONSchemaGenerator.isValidJSON(json)) {
			var generator = new JSONSchemaGenerator({
				url: $('#txtUrl').val(),
				json: json,
				forceRequired: $('#chkForceRequired').is(':checked'),
				includeDefaults: $('#chkIncludeDefaults').is(':checked')
			});

			$('#sourceJSON').val(generator.formatJSON(json));
			$('#JSONSchema').html(generator.getSchemaAsString(true));
		} else {
			$('#sourceJSON').parent().addClass('has-error');
		}
	}

	$('#btnConvert').click(function() {
		convertJSON2Schema();
	});

	$('#sourceJSON').keyup(function() {
		var json = $('#sourceJSON').val();

		if (!JSONSchemaGenerator.isValidJSON(json)) {
			$('#sourceJSON').parent().addClass('has-error');
		} else {
			$('#sourceJSON').parent().removeClass('has-error');
		}
	});

	convertJSON2Schema();
});
