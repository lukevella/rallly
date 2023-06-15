var width = 960
var height = 660
var map = d3.select('#map').append('svg')
// map.attr('width', width).attr('height', height)
map.attr('preserveAspectRatio', 'xMinYMin meet')
map.attr('viewBox', `0 0 ${width} ${height}`)

// var dayWidth = 600
var scale = d3.scale.linear()
scale.range([0, 100]).domain([0, 1])

var s = spacetime.now()

window.day = new Vue({
  el: '#today',
  data: {
    s: s,
    hi: 'world',
    timezone: s.timezone().name,
    scale: scale,
    time: s.format('time-12h'),
    tzData: [],
    months: [
      '#6accb2',
      '#705E5C',
      '#cc8a66',
      '#cc7066',
      '#7f9c6c',
      '#6699cc',
      '#303b50',
      '#335799',
      '#e6d7b3',
      '#914045',
      '#C4ABAB',
      '#838B91'
    ],
    controls: [
      {
        title: 'hour',
        render: function() {
          return s.h12() + s.ampm()
        }
      },
      {
        title: 'minute',
        render: function() {
          return s.format('minute')
        }
      },
      {
        title: 'day',
        render: function() {
          return s.format('date-ordinal')
        }
      },
      {
        title: 'month',
        render: function() {
          return s.format('month-short')
        }
      },
      {
        title: 'week',
        render: function() {
          return s.week()
        }
      },
      {
        title: 'year',
        render: function() {
          return s.year()
        }
      }
    ]
  },

  methods: {
    changeTZ: function(tz) {
      // there are some "timezone" like: "America/Indiana/Indianapolis"
      // and we can not find such "timezone" in zonefile
      //
      // but "America/Indiana" is available, so just trim the last section
      // it's a wild guess but works.
      tz = tz
        .split('/')
        .slice(0, 2)
        .join('/')
      this.s = this.s.goto(tz)
      this.timezone = tz
    },
    add: function(unit) {
      this.s = this.s.add(1, unit)
    },
    subtract: function(unit) {
      this.s = this.s.minus(1, unit)
    },

    drawDay: function() {},

    drawMap: function() {
      var timezones = this.tzData
      var projection = d3.geo
        .mercator()
        .scale(width / 2 / Math.PI)
        .translate([width, height])
        .precision(0.1)
      var path = d3.geo.path().projection(projection)
      path.projection(null)

      map
        .insert('g', '.graticule')
        .attr('class', 'timezones')
        .selectAll('path')
        .data(topojson.feature(timezones, timezones.objects.timezones).features)
        .enter()
        .append('path')
        .attr('d', path)
        .on('click', d => {
          console.log(d.id)
          this.changeTZ(d.id)
          this.drawMap()
        })
        .attr('fill', d => {
          if (d.id === this.timezone) {
            return 'cornflowerblue'
          }
          return null
        })
        .append('title')
        .text(function(d) {
          return d.id
        })

      map
        .insert('path', '.graticule')
        .datum(
          topojson.mesh(timezones, timezones.objects.timezones, function(a, b) {
            return a !== b
          })
        )
        .attr('class', 'boundary')
        .attr('d', path)
    }
  },
  created() {
    d3.json('./lib/timezones.json', (error, timezones) => {
      this.tzData = timezones
      this.drawMap()
    })
  }
})
