function initialise_marketplace_data(callback) {

  if (get_all_marketplace_data() == null) {
    d3.csv('./opportunity-data.csv', function(err, data) {
      console.log('writing csv data to local storage');
      localStorage.setItem("dos-csv", JSON.stringify(data));
      callback(null);
    });
  }
  else {
    callback(null);
  }

}


function get_all_marketplace_data() {
  data = localStorage.getItem("dos-csv");
  if (data != null) {
    return JSON.parse(data);
  }
  else {
    return null;
  }
}

//@todo - get synonyms

function get_marketplace_data_for_org(buyer_or_supplier_name, segment = 'org') {

  console.log('parsing dos data for ' + buyer_or_supplier_name);
  csv = get_all_marketplace_data()

  var segment_data = {
    'name': buyer_or_supplier_name,
    'summary': {},
    'opportunities':[],
    'opportunities_by_value':{},
    'opportunities_no_value':[],
    'other_segment':{},
  }

  buyer_or_supplier_names = ['Wunder Ltd','We Are Snook Ltd'];

  var filtered_csv;
  if (segment == 'org') {
    console.log(buyer_or_supplier_name);
    filtered_csv = csv.filter(function(opportunity) { return opportunity['Organisation Name'] === buyer_or_supplier_name; });
  }
  else {
    filtered_csv = csv.filter(function(opportunity) { return buyer_or_supplier_names.includes(opportunity['Winning supplier']); });
  }

  segment_data.opportunities = filtered_csv;

  var o = {};
  o.name = buyer_or_supplier_name;
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
  supplier_values.name = buyer_or_supplier_name;
  supplier_values.children = [];
  var supplier_totals = {};
  supplier_totals.name = buyer_or_supplier_name;
  supplier_totals.children = [];
  other_segment_query_param = segment == 'supplier' ? 'o' : 's';
  suppliers.forEach(function(supplier) {
    if (supplier.key != "") {
      supplier_value = d3.nest()
        .rollup(function(opportunities) { return {"total": opportunities.length, "total_value": d3.sum(opportunities, function(d) {return parseFloat(d['Contract amount']);})} })
        .entries(supplier.values);
      supplier_values.children.push( { "name": supplier.key, "value": supplier_value.total_value, "link": ".?" + other_segment_query_param + "=" + supplier.key} );
      supplier_totals.children.push( { "name": supplier.key, "value": supplier_value.total, "link": ".?" + other_segment_query_param + "=" + supplier.key});
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
