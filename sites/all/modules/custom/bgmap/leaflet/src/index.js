import 'whatwg-fetch';
import 'es6-promise/auto';
import 'blob-polyfill';

import "./index.css";
import counties_pbf from "./counties.geojson";
import state_lines_pbf from "./state_lines.geojson";

import states_pbf from "./states.geojson";
import border_pbf from "./border.geojson";

import L from 'leaflet';
import 'leaflet-fullscreen';
import 'leaflet.pattern/src/Pattern.js';
import 'leaflet.pattern/src/Pattern.SVG.js';
import 'leaflet.pattern/src/PatternShape.js';
import 'leaflet.pattern/src/PatternShape.SVG.js';
import 'leaflet.pattern/src/PatternPath.js';
import 'leaflet.pattern/src/StripePattern.js';

import decode from 'geobuf/decode.js';
import Pbf from 'pbf';

import 'leaflet/dist/leaflet.css';
import 'leaflet-fullscreen/dist/Leaflet.fullscreen.css';
import 'no-darkreader';

// const states = {"1":"Alabama","2":"Alaska","4":"Arizona","5":"Arkansas","6":"California","8":"Colorado","9":"Connecticut","10":"Delaware","11":"District of Columbia","12":"Florida","13":"Georgia","15":"Hawaii","16":"Idaho","17":"Illinois","18":"Indiana","19":"Iowa","20":"Kansas","21":"Kentucky","22":"Louisiana","23":"Maine","24":"Maryland","25":"Massachusetts","26":"Michigan","27":"Minnesota","28":"Mississippi","29":"Missouri","30":"Montana","31":"Nebraska","32":"Nevada","33":"New Hampshire","34":"New Jersey","35":"New Mexico","36":"New York","37":"North Carolina","38":"North Dakota","39":"Ohio","40":"Oklahoma","41":"Oregon","42":"Pennsylvania","44":"Rhode Island","45":"South Carolina","46":"South Dakota","47":"Tennessee","48":"Texas","49":"Utah","50":"Vermont","51":"Virginia","53":"Washington","54":"West Virginia","55":"Wisconsin","56":"Wyoming"};
const states = {};

const map = L.map('map', {
  center: [0, 0],
  minZoom: -6,
  maxZoom: 0,
  crs: L.CRS.Simple,
  fullscreenControl: true,
});
map.attributionControl.setPrefix(false);

let bounds;

map.on('fullscreenchange', () => {
  if (bounds) {
    map.fitBounds(bounds);
  }
});

let counties_mode = false;
let counties_fetched = false;
let states_fetched = false;
const nid = window.location.hash.substring(1);

let records = {};
let records_counties = {};
const info = new (L.Control.extend({
  onAdd: function (map) {
    this.div = L.DomUtil.create('div', 'info');
    this.div.hidden = true;
    return this.div;
  },

  update: function (props) {
    if (!props || !props.id) {
      this.div.innerHTML = '';
      this.div.hidden = true;
      return;
    }
    this.div.hidden = false;
    if (props.state) {
      this.div.innerHTML = props.name;
      if (counties_mode) {
        this.div.innerHTML += '<br>County data not available for Canada';
        return;
      }
    } else {
      // Add DC to the CA provinces?
      const state = props.id.substring(0, props.id.length-3);
      this.div.innerHTML = state == 11 ? props.name : props.name + ', ' + states[state];
    }
    const record = (counties_mode ? records_counties : records)[props.id];
    if (record) {
      this.div.innerHTML += '<br>Reported ' + record.reportCount + ' times';
    }
  },

}));

const ca_layer = L.featureGroup();
const us_layer = L.layerGroup();
const county_layer = L.layerGroup();
let state_lines, border;

const button = new (L.Control.extend({
  onAdd: function (map) {
    const div = L.DomUtil.create('div', 'info');
    const updateText = () => div.innerText = 'Switch to ' + (counties_mode ? 'states/provinces' : 'counties') + ' view';
    updateText();

    div.addEventListener('click', () => {
      if (!counties_fetched) {
        fetchShapes(true).then(()=> {
          counties_mode = true;
        });
      } else if (counties_mode) {
        county_layer.removeFrom(map);
        us_layer.addTo(map);
      } else {
        us_layer.removeFrom(map);
        county_layer.addTo(map);
        state_lines.bringToFront();
      }
      border.bringToFront();
      counties_mode = !counties_mode;
      ca_layer.setStyle({fillPattern: counties_mode && stripes});
      updateText();
    });

    return div;
  }
}));

button.addTo(map);
info.addTo(map);

const dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const color = dark ? '#eee' : '#000';
const fillColor = dark ? '#444' : '#eee';
const green = dark ? '#13a013' : '#19d119';

const stripes = new L.StripePattern({
  angle: 45,
  color: fillColor,
  spaceColor: dark ? '#666' : '#bbb',
  spaceOpacity: 1,
  weight: 20,
  spaceWeight: 20,
  height: 40,
  width: 40,
});
stripes.addTo(map);

const blobPromise = (resp) => resp.blob().then((blob) => blob.arrayBuffer());

fetch(border_pbf).then(blobPromise).then((data) => {
  border = L.geoJSON(decode(new Pbf(data)), {
    style: {weight: 2, color, fillColor: false},
  }).addTo(ca_layer);
});

function fetchShapes(counties_mode) {
  if (counties_mode ? counties_fetched : states_fetched) {
    return Promise.reject('Already fetched');
  }

  const jsonPromise = nid && !isNaN(nid) ? fetch("/node/" + nid + "/bgmap" + (counties_mode ? "/json" : "/state/json")).then((resp) => resp.json()) : Promise.reject('No node ID specified');

  if (counties_mode) {
    fetch(state_lines_pbf).then(blobPromise).then((data) => {
      state_lines = L.geoJSON(decode(new Pbf(data)), {
        style: {weight: 1, color, fillColor: false},
      }).addTo(county_layer);
    });
  }

  return fetch(counties_mode ? counties_pbf : states_pbf).then(blobPromise).then((data) => {
    const weight = counties_mode && !dark ? 0.25 : 0.5;
    const layers = {};
    const on = {
      mouseover: (e) => {
        const obj = e.target;
        obj.setStyle({weight: 4});
        obj.bringToFront();
        info.update(obj.feature.properties);
      },
      mouseout: (e) => {
        const obj = e.target;
        obj.setStyle({weight});
        obj.bringToBack();
        info.update();
      },
    };
    const shapes = L.geoJson(decode(new Pbf(data)), {
      style: {weight, color, fillColor, fillOpacity: 1},
      onEachFeature: (_, f) => {
        f.on(on);
        layers[f.feature.properties.id] = f;
        f.feature.properties.state = !counties_mode;
      }});
    if (!counties_mode) {
      shapes.eachLayer((f) => {
        const id = f.feature.properties.id;
        const is_us = id.length == 2;
        f.addTo(is_us ? us_layer : ca_layer);
        if (is_us) {
          states[id[0] == '0' ? id.substring(1) : id] = f.feature.properties.name;
        }
      });
    }

    jsonPromise.then((data) => {
      let _records;
      if (counties_mode) {
        records_counties = _records = data;
      } else {
        _records = data.us || {};
        const ca = data.ca || {};
        for (const id of Object.keys(ca)) {
          _records['1'+id] = ca[id];
        }
        records = _records;
      }

      for (const f of Object.keys(_records)) {
        if (layers[f] !== undefined) {
          layers[f].setStyle({fillColor: green});
        }
      }
    });

    if (counties_mode) {
      shapes.addTo(county_layer);
      us_layer.removeFrom(map);
      county_layer.addTo(map);
      counties_fetched = true;
    } else {
      us_layer.addTo(map);
      ca_layer.addTo(map);
      states_fetched = true;

      const hawaii_b = us_layer.getLayers()[50].getBounds().pad(0.5);
      L.rectangle(hawaii_b, {weight: 1, color, fill: false, dashArray: '8'}).addTo(ca_layer);
    }

    shapes.bringToBack();
    return shapes;
  });
}

fetchShapes(false).then((shapes) => {
  bounds = shapes.getBounds();
  map.fitBounds(bounds);
  border.bringToFront();
});
