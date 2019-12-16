// https://observablehq.com/@johnburnmurdoch/bar-chart-race@482
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md `# Bar chart race`
)});
  main.variable(observer()).define(["html"], function(html){return(
html`<style>
text{
  font-size: 16px;
  font-family: Open Sans, sans-serif;
}
text.title{
  font-size: 24px;
  font-weight: 500;
}
text.subTitle{
  font-weight: 500;
  fill: #777777;
}
text.caption{
  font-weight: 400;
  font-size: 14px;
  fill: #777777;
}
text.label{
  font-weight: 600;
}
text.yearText{
  font-size: 64px;
  font-weight: 700;
  opacity: 0.25;
}
.tick text {
  fill: #777777;
}
.xAxis .tick:nth-child(2) text {
  text-anchor: start;
}
.tick line {
  shape-rendering: CrispEdges;
  stroke: #dddddd;
}
.tick line.origin{
  stroke: #aaaaaa;
}
path.domain{
  display: none;
}
</style>`
)});
  main.variable(observer("tickDuration")).define("tickDuration", function(){return(
333
)});
  main.variable(observer("top_n")).define("top_n", function(){return(
12
)});
  main.variable(observer("chart")).define("chart", ["d3","DOM","width","height","top_n","mapcData","halo","tickDuration"], function(d3,DOM,width,height,top_n,mapcData,halo,tickDuration)
{
  const svg = d3.select(DOM.svg(width, height));

  const margin = {
    top: 80,
    right: 0,
    bottom: 5,
    left: 0
  };

  let barPadding = (height-(margin.bottom+margin.top))/(top_n*5);

  let title = svg.append('text')
    .attrs({
      class: 'title',
      y: 24
    })
    .html('MAPC Employment by 3digit sector, year over year 2001-2017');

  let subTitle = svg.append('text')
    .attrs({
      class: 'subTitle',
      y: 55
    })
    .html('Employment sector, monthly average');

  let caption = svg.append('text')
    .attrs({
      class: 'caption',
      x: width,
      y: height-5
    })
    .styles({
      'text-anchor': 'end'
    })
    .html('Source: MAPC DataCommon');

  let year = 2000;
  let lastAvgEmpValue = 1000;

    mapcData.forEach(d => {
    d.avgemp = +d.avgemp,
    d.lastAvgEmpValue = +d.lastAvgEmpValue + 1000,
    d.avgemp = isNaN(d.avgemp) ? 0 : d.avgemp,
    d.cal_year = +d.cal_year,
    d.colour = d3.hsl(Math.random()*360,0.75,0.75)
  });

  let yearSlice = mapcData.filter(d => d.cal_year == d.cal_year && !isNaN(d.avgemp))
    .sort((a,b) => b.value - a.value)
    .slice(0,top_n);

  yearSlice.forEach((d,i) => d.avgemp = i);

  let x = d3.scaleLinear()
    .domain([0, d3.max(yearSlice, d => d.avgemp)])
    .range([margin.left, width-margin.right-65]);

  let y = d3.scaleLinear()
    .domain([top_n, 0])
    .range([height-margin.bottom, margin.top]);

  let xAxis = d3.axisTop()
    .scale(x)
    .ticks(width > 500 ? 5:2)
    .tickSize(-(height-margin.top-margin.bottom))
    .tickFormat(d => d3.format(',')(d));

  svg.append('g')
    .attrs({
      class: 'axis xAxis',
      transform: `translate(0, ${margin.top})`
    })
    .call(xAxis)
      .selectAll('.tick line')
      .classed('origin', d => d == 0);

  svg.selectAll('rect.bar')
    .data(yearSlice, d => d.naicstitle)
    .enter()
    .append('rect')
    .attrs({
      class: 'bar',
      x: x(0)+1,
      // width: d => x(d.avgemp)-x(0)-1,
      width: d => x(d.avgemp),
      y: d => y(d.avgemp)+5,
      height: y(1)-y(0)-barPadding
    })
    .styles({
      fill: d => d.colour
    });

  svg.selectAll('text.label')
    .data(yearSlice, d => d.naicstitle)
    .enter()
    .append('text')
    .attrs({
      class: 'label',
      // x: d => x(d.avgemp)-8,
      x: d => x(d.avgemp),
      // y: d => y(d.avgemp)+5+((y(1)-y(0))/2)+1,
      y: d => y(d.avgemp),
      'text-anchor': 'end'
    })
    .html(d => d.naicstitle);

  svg.selectAll('text.valueLabel')
    .data(yearSlice, d => d.naicstitle)
    .enter()
    .append('text')
    .attrs({
      class: 'valueLabel',
      x: d => x(d.avgemp)+5,
      // y: d => y(d.avgemp)+5+((y(1)-y(0))/2)+1,
      y: d => y(d.avgemp),
    })
    // .text(d => d3.format(',.0f')(d.lastAvgEmpValue));
    .text(d => d3.format('.0f')(d.lastAvgEmpValue));

  let yearText = svg.append('text')
    .attrs({
      class: 'yearText',
      x: width-margin.right,
      // y: height-25
      y: height
    })
    .styles({
      'text-anchor': 'end'
    })
    .html(~~year)
    .call(halo, 10);

  let ticker = d3.interval(e => {

    yearSlice = mapcData.filter(d => d.cal_year == d.cal_year && !isNaN(d.avgemp))
      .sort((a,b) => b.value - a.value)
      .slice(0,top_n);

    yearSlice.forEach((d,i) => d.avgemp = i);

    x.domain([0, d3.max(yearSlice, d => d.avgemp)]);

    svg.select('.xAxis')
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .call(xAxis);

    let bars = svg.selectAll('.bar').data(yearSlice, d => d.naicstitle);

    bars
      .enter()
      .append('rect')
      .attrs({
        class: d => `bar ${d.naicstitle.replace(/\s/g,'_')}`,
        x: x(0)+1,
        // width: d => x(d.avgemp)-x(0)-1,
        width: d => x(d.avgemp),
        y: d => y(top_n+1)+5,
        height: y(1)-y(0)-barPadding
      })
      .styles({
        fill: d => d.colour
      })
      .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attrs({
          y: d => y(d.avgemp)+5
        });

    bars
      .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attrs({
          // width: d => x(d.avgemp)-x(0)-1,
          width: d => x(d.avgemp),
          y: d => y(d.avgemp)+5
        });

    bars
      .exit()
      .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attrs({
          width: d => x(d.avgemp)-x(0)-1,
          y: d => y(top_n+1)+5
        })
        .remove();

    let labels = svg.selectAll('.label').data(yearSlice, d => d.naicstitle);

    labels
      .enter()
      .append('text')
      .attrs({
        class: 'label',
        x: d => x(d.avgemp)-8,
        y: d => y(top_n+1)+5+((y(1)-y(0))/2),
        'text-anchor': 'end'
      })
      .html(d => d.naicstitle)
      .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attrs({
          y: d => y(d.avgemp)+5+((y(1)-y(0))/2)+1,
        });

    labels
      .transition()
      .duration(tickDuration)
        .ease(d3.easeLinear)
        .attrs({
          x: d => x(d.avgemp)-8,
          y: d => y(d.avgemp)+5+((y(1)-y(0))/2)+1
        });

    labels
      .exit()
      .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attrs({
          x: d => x(d.avgemp)-8,
          y: d => y(top_n+1)+5
        })
        .remove();

    let valueLabels = svg.selectAll('.valueLabel').data(yearSlice, d => d.naicstitle);

    valueLabels
      .enter()
      .append('text')
      .attrs({
        class: 'valueLabel',
        x: d => x(d.avgemp)+5,
        y: d => y(top_n+1)+5,
      })
      .text(d => d3.format(',.0f')(d.lastAvgEmpValue))
      .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attrs({
          y: d => y(d.avgemp)+5+((y(1)-y(0))/2)+1
        });

    valueLabels
      .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attrs({
          x: d => x(d.avgemp)+5,
          y: d => y(d.avgemp)+5+((y(1)-y(0))/2)+1
        })
        .tween("text", function(d) {
          let i = d3.interpolateRound(d.lastAvgEmpValue, d.avgemp);
          return function(t) {
            this.textContent = d3.format(',')(i(t));
          };
        });

    valueLabels
      .exit()
      .transition()
        .duration(tickDuration)
        .ease(d3.easeLinear)
        .attrs({
          x: d => x(d.avgemp)+5,
          y: d => y(top_n+1)+5
        })
        .remove();

    yearText.html(~~year);

    if(year == 2018) ticker.stop();
    year = d3.format('.1f')((+year) + 0.1);
  },tickDuration);

  return svg.node();
}
);
  main.variable(observer("height")).define("height", function(){return(
600
)});
  main.variable(observer("mapcData")).define("mapcData", ["d3"], function(d3){return(
// d3.csv('https://gist.githubusercontent.com/johnburnmurdoch/2e5712cce1e2a9407bf081a952b85bac/raw/08cf82f5e03c619f7da2700d1777da0b5247df18/INTERBRAND_brand_values_2000_2018_decimalised.csv')
// d3.csv('naics.csv')
d3.json('csvjson.json')
  )
  });
  main.variable(observer("halo")).define("halo", function(){return(
function(text, strokeWidth) {
  text.select(function() { return this.parentNode.insertBefore(this.cloneNode(true), this); })
    .styles({
      fill: '#ffffff',
      stroke: '#ffffff',
      'stroke-width': strokeWidth,
      'stroke-linejoin': 'round',
      opacity: 1
    });
}
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require('d3-scale','d3-array','d3-fetch','d3-selection','d3-timer','d3-color','d3-format','d3-ease','d3-interpolate','d3-axis','d3-selection-multi')
)});
  return main;
}
