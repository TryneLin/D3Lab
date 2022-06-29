// 資料取得
d3.csv('data/movies.csv', type).then(
    res => {
        ready(res)
        // console.log('local CSV:', res)
        // debugger
    }
)

// 資料前處理

// 缺失值
const parseNA = string => (string === 'NA' ? undefined : string)

// 字串轉日期格式
const parseDate = string => d3.timeParse('%Y-%m-%d')(string)

// 資料格式轉換
function type(d) {
    const date = parseDate(d.release_date)
    return {
        // + 字串轉數字
        budget: +d.budget,
        genre: parseNA(d.genre),
        // genres: d.genres,
        genres: JSON.parse(d.genres).map(d => d.name),
        homepage: parseNA(d.homepage),
        id: +d.id,
        imdb_id: parseNA(d.imdb_id),
        original_language: parseNA(d.original_language),
        overview: parseNA(d.overview),
        popularity: +d.popularity,
        poster_path: parseNA(d.poster_path),
        // production_countries: d.production_countries,
        production_countries: JSON.parse(d.production_countries).map(d => d.name),
        release_date: date,
        release_year: date.getFullYear(),
        revenue: +d.revenue,
        runtime: +d.runtime,
        // status: parseNA(d.status),
        tagline: parseNA(d.tagline),
        title: parseNA(cutText(d.title)),
        // video: parseNA(d.video),
        vote_average: +d.vote_average,
        vote_count: +d.vote_count
    }
}

// 資料篩選
function filterData(data) {
    return data.filter(
        d => {
            return (
                d.release_year > 1999 && d.release_year < 2010 &&
                d.revenue > 0 &&
                d.budget > 0 &&
                d.genre &&
                cutText(d.title)

            )
        }
    )
}

function cutText(string){
    return string.length <35 ? string : string.substring(0,35)+"..."
}

function prepareBarChartData(data) {
    console.log(data)
    // 分組篩選後資料
    const dataMap = d3.rollup(data,
        v => d3.sum(v, d => d.revenue),
        d => d.genre,
    )
    const dataArray = Array.from(dataMap, d => ({ genre: d[0], revenue: d[1] }))
    // debugger
    return dataArray

}

function setupCanvas(barChartData, moviesClean) {
    // debugger

    let metric = 'revenue'

    function click() {
        metric = this.dataset.name
        const thisData = chooseData(metric, moviesClean)
        update(thisData)
    }

    d3.selectAll('button').on('click', click)

    function update(data) {
        console.log(data)
        //update scale
        xMax = d3.max(data, d => d[metric])
        xScale_v3 = d3.scaleLinear([0, xMax], [0, chart_width])

        yScale = d3.scaleBand().domain(data.map(d => cutText(d.title)))
            .rangeRound([0, chart_height]).paddingInner(0.25)

        // transition settings
        const defaultDelay = 1000
        const transitionDelay = d3.transition().duration(defaultDelay)

        // update axis
        xAxisDraw.transition(transitionDelay).call(xAxis.scale(xScale_v3))
        yAxisDraw.transition(transitionDelay).call(yAxis.scale(yScale))

        // update header
        // header.select('#header').text(`Top 14 ${metric} movies ${metric === 'popularity' ? '' : 'in $US'}`)
        header.text(`Top 14 ${metric} movies ${metric === 'popularity' ? '' : 'in $US'}`)

        //Update Bar
        bars.selectAll('.bar').data(data, d => cutText(d.title)).join(
            enter => {
                enter.append('rect').attr('class', 'bar')
                    .attr('x', 0).attr('y', d => yScale(cutText(d.title)))
                    .attr('height', yScale.bandwidth())
                    .style('fill', 'lightcyan')
                    .transition(transitionDelay)
                    .delay((d, i) => i * 20)
                    .attr('width', d => xScale_v3(d[metric]))
                    .style('fill', 'dodgerblue')
            },
            update => {
                update.transition(transitionDelay).delay((d,i) =>i*20)
                    .attr('y', d => yScale(cutText(d.title)))
                    .attr('width', d => xScale_v3(d[metric]))
            },
            exit => {
                exit.transition().duration(defaultDelay/2)
                    .style('fill-opacity', 0)
                    .remove()
            }
        )
    }

    const svg_width = 700
    const svg_height = 500
    const chart_margin = { top: 40, bottom: 20, right: 80, left: 250 }
    const chart_width = svg_width - (chart_margin.left + chart_margin.right)
    const chart_height = svg_height - (chart_margin.top + chart_margin.bottom)

    const this_svg = d3.select('.bar_chart_container').append('svg')
        .attr('width', svg_width).attr('height', svg_height)
        .append('g').attr('transform', `translate(${chart_margin.left},${chart_margin.top})`);

    //scale
    //水平空間的分配 - 找出最大/最小值並自動縮放
    //V1.寫法1. d3.extent() : find the max & min in revenue 找最大/最小值
    const xExtent = d3.extent(barChartData,d => d.revenue);
    // domain: 資料 range:實際上要放東西的地方
    const xScale_v1 = d3.scaleLinear().domain(xExtent).range([0, chart_width])
    //V2.寫法2 d3.max()
    let xMax = d3.max(barChartData, d => d.revenue);
    const xScale_v2 = d3.scaleLinear().domain([0, xMax]).range([0, chart_width]);
    //V3. 簡寫 Short writing for v2
    let xScale_v3 = d3.scaleLinear([0, xMax], [0, chart_width]);
    // Short writing for v1
    const xScale_v4 = d3.scaleLinear(xExtent, [0, chart_width]);

    //垂直空間的分配 - 平均分布給各種類
    let yScale = d3.scaleBand().domain(barChartData.map(d => cutText(d.title)))
        .rangeRound([0, chart_height])
        .paddingInner(0.25); // bar之間的距離

    // const bars = this_svg.selectAll('.bar').data(barChartData)
    //                                         //enter() 出現圖表
    //                                        .enter()
    //                                        .append('rect')
    //                                             .attr('class','bar')
    //                                             .attr('x',0)
    //                                             .attr('y',d=>yScale(d.genre))
    //                                             .attr('width',d=>xScale_v4(d.revenue))
    //                                             .attr('height',yScale.bandwidth())
    //                                             .style('fill','dodgerblue')
    const bars = this_svg.append('g').attr('class', 'bars')

    //Draw header
    // let header = this_svg.append('g').attr('class', 'bar-header')
    // .attr('transform', `translate(0,${-chart_margin.top / 2})`)
    // .append('text');
    // header.append('tspan').text('Total 15 xxx movies');
    // header.append('tspan').text('Years:2000-2009')
    //     .attr('x', 0).attr('y', 20).style('font-size', '0.8em').style('fill', 'gray');
    let header = $("#header")
        .attr('transform', `translate(0,${-chart_margin.top / 2})`)
        .text('Total 15 xxx movies')

    // x y軸
    let xAxis = d3.axisTop(xScale_v3).ticks(5).tickFormat(formatTicks)
        .tickSizeInner(-chart_height)
        .tickSizeOuter(0)

    // const xAxisDraw = this_svg.append('g').attr('class','x axis').call(xAxis)
    let xAxisDraw = this_svg.append('g').attr('class', 'x axis')

    let yAxis = d3.axisLeft(yScale).tickSize(0)
    // const yAxisDraw = this_svg.append('g').attr('class','y axis').call(yAxis)
    let yAxisDraw = this_svg.append('g').attr('class', 'y axis')

    yAxisDraw.selectAll('text').attr('dx', '-0.6em')
    update(barChartData)

    function formatTicks(d) {
        return d3.format('~s')(d)
            .replace('M', 'mil')
            .replace('G', 'bil')
            .replace('T', 'til')
    }

}

// Main 顯示篩選後資料
function ready(movies) {
    const moviesClean = filterData(movies)

    // get top 15 revenue movies
    const revenueData = chooseData("revenue", moviesClean)
    // debugger
    setupCanvas(revenueData, moviesClean)
}

function chooseData(metric, movieClean) {
    const thisData = movieClean.sort((a, b) => b[metric] - a[metric]).filter((d, i) => i < 15);
    return thisData;
}
