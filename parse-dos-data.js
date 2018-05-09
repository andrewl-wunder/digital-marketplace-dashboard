function parse_dos_data(csv, org_or_supplier, segment = 'org') {
  var segment_data = {
    'name': org_or_supplier,
    'summary': {},
    'opportunities':[],
    'opportunities_by_value':{},
    'opportunities_no_value':[],
    'other_segment':{},
  }

  var filtered_csv;
  if (segment == 'org') {
    console.log(org_or_supplier);
    filtered_csv = csv.filter(function(opportunity) { return opportunity['Organisation Name'] === org_or_supplier; });
  }
  else {
    filtered_csv = csv.filter(function(opportunity) { return opportunity['Winning supplier'] === org_or_supplier; });
  }

  segment_data.opportunities = filtered_csv;

  var o = {};
  o.name = org_or_supplier;
  o.children = [];
  filtered_csv.forEach(function(opportunity) {
    if (isNaN(parseFloat(opportunity['Contract amount']))) {
      segment_data.opportunities_no_value.push(opportunity);
    }
    else {
      o.children.push( { "name": opportunity.Opportunity, "value": opportunity['Contract amount'], "link": '#opportunity-' + opportunity.ID } );
    }
  });

  //@todo - some renaming here so suppliers/orgs makes sense.
  if (segment == 'org') {
  var suppliers = d3.nest()
    .key(function(d) { return d['Winning supplier']; })
    .entries(filtered_csv);
  }
  else {
  var suppliers = d3.nest()
    .key(function(d) { return d['Organisation Name']; })
    .entries(filtered_csv);
  }

  var supplier_values = {};
  supplier_values.name = org_or_supplier;
  supplier_values.children = [];
  var supplier_totals = {};
  supplier_totals.name = org_or_supplier;
  supplier_totals.children = [];
  other_segment_query_param = segment == 'supplier' ? 'o' : 's';
  suppliers.forEach(function(supplier) {
    if (supplier.key != "") {
      supplier_value = d3.nest()
        .rollup(function(opportunities) { return {"total": opportunities.length, "total_value": d3.sum(opportunities, function(d) {return parseFloat(d['Contract amount']);})} })
        .entries(supplier.values);
      supplier_values.children.push( { "name": supplier.key, "value": supplier_value.total_value, "link": "/?" + other_segment_query_param + "=" + supplier.key} );
      supplier_totals.children.push( { "name": supplier.key, "value": supplier_value.total, "link": "/?" + other_segment_query_param + "=" + supplier.key});
    }
  });

  segment_data.other_segment.values = supplier_values;
  segment_data.other_segment.totals = supplier_totals;

  segment_data.summary.opportunities_by_value = d3.nest()
    .rollup(function(opportunities) { return {"total": opportunities.length, "total_value": d3.sum(opportunities, function(d) {return parseFloat(d.value);})} })
    .entries(o.children);

  segment_data.summary.opportunities_no_value = d3.nest()
    .rollup(function(opportunities) { return {"total": opportunities.length, "total_value": d3.sum(opportunities, function(d) {return parseFloat(d['Contract amount']);})} })
    .entries(segment_data.opportunities_no_value);



  segment_data.opportunities_by_value = o;
  console.log(segment_data);
  return segment_data;
}
