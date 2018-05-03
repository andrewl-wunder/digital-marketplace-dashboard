function parse_dos_data(csv, org) {
  var org_data = {
    'name': org,
    'summary': {},
    'opportunities':[],
    'opportunities_by_value':{},
    'opportunities_no_value':[],
    'suppliers':{},
  }

  var filtered_csv = csv.filter(function(opportunity) { return opportunity['Organisation Name'] === org; });


  org_data.opportunities = filtered_csv;

  var o = {};
  o.name = org;
  o.children = [];
  filtered_csv.forEach(function(opportunity) {
    if (isNaN(parseFloat(opportunity['Contract amount']))) {
      console.log(parseFloat(opportunity['Contract amount']));
      org_data.opportunities_no_value.push(opportunity);
    }
    else {
      o.children.push( { "name": opportunity.Opportunity, "value": opportunity['Contract amount'] } );
      console.log(parseFloat(opportunity['Contract amount']));
    }
  });

  var suppliers = d3.nest()
    .key(function(d) { return d['Winning supplier']; })
    .entries(filtered_csv);

  var supplier_values = {};
  supplier_values.name = org;
  supplier_values.children = [];
  var supplier_totals = {};
  supplier_totals.name = org;
  supplier_totals.children = [];
  suppliers.forEach(function(supplier) {
    if (supplier.key != "") {
      supplier_value = d3.nest()
        .rollup(function(opportunities) { return {"total": opportunities.length, "total_value": d3.sum(opportunities, function(d) {return parseFloat(d['Contract amount']);})} })
        .entries(supplier.values);
      supplier_values.children.push( { "name": supplier.key, "value": supplier_value.total_value} );
      supplier_totals.children.push( { "name": supplier.key, "value": supplier_value.total} );
    }
  });

  org_data.suppliers.supplier_values = supplier_values;
  org_data.suppliers.supplier_totals = supplier_totals;

  org_data.summary.opportunities_by_value = d3.nest()
    .rollup(function(opportunities) { return {"total": opportunities.length, "total_value": d3.sum(opportunities, function(d) {return parseFloat(d.value);})} })
    .entries(o.children);

  org_data.summary.opportunities_no_value = d3.nest()
    .rollup(function(opportunities) { return {"total": opportunities.length, "total_value": d3.sum(opportunities, function(d) {return parseFloat(d['Contract amount']);})} })
    .entries(org_data.opportunities_no_value);



  org_data.opportunities_by_value = o;
  console.log(org_data);
  return org_data;
}
