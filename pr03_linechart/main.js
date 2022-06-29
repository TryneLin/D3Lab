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
        title: parseNA(d.title),
        // video: parseNA(d.video),
        vote_average: +d.vote_average,
        vote_count: +d.vote_count
    }
}

// 資料篩選/排序
function filterData(data) {
    return data.filter(
        d => {
            return (
                d.release_year > 1999 && d.release_year < 2010 &&
                d.revenue > 0 &&
                d.budget > 0 &&
                d.genre &&
                d.title

            )
        }
    )
}

function prepareLineChartData(data) {
    const groupByYear = d => d.release_year
    const sumOfRevernue = values => d3.sum(values, d => d.revenue)
    const sumOfRevernueByYear = d3.rollup(data, sumOfRevernue , groupByYear)
    const sumOfBudget = values => d3.sum(values, d => d.budget)
    const sumOfBudgetByYear = d3.rollup(data, sumOfBudget , groupByYear)
    // 照年份遞增排序
    const revenueArray = Array.from(sumOfRevernueByYear).sort((a,b) => a[0]-b[0])
    const budgetArray = Array.from(sumOfBudgetByYear).sort((a,b) => a[0]-b[0])
    const revenueAndBudgetArray = revenueArray.map(d=>d[1]).concat(budgetArray.map(d=>d[1]))
    // 型態轉換 year string -> date object x軸
    const parseYear = d3.timeParse('%Y')
    const dates = revenueArray.map(d=>parseYear(d[0]))
    // 尋找邊緣最大值
    const yMax = d3.max(revenueAndBudgetArray);
    
    
    const lineData = {
        series:[
        {
            name: 'Revenue',
            color: 'blue',
            // 在array中的date是字串, 要再換回時間才能跟下面dates對上
            values: revenueArray.map(d=>({date:parseYear(d[0]),value:d[1]}))
        },
        {
            name: 'Budget',
            color: 'orange',
            // 在array中的date是字串, 要再換回時間才能跟下面dates對上
            values: budgetArray.map(d=>({date:parseYear(d[0]),value:d[1]}))
        }],
        dates:dates,
        yMax:yMax,
        


    }
    return lineData
    // debugger
}

function setupCanvas(lineChartData) {
    const svg_width = 700
    const svg_height = 500
    const chart_margin = { top: 40, bottom: 60, right: 90, left: 80 }
    const chart_width = svg_width - (chart_margin.left + chart_margin.right)
    const chart_height = svg_height - (chart_margin.top + chart_margin.bottom)

    // Scatter base
    const this_svg = d3.select('.line_chart_container').append('svg')
        .attr('width', svg_width).attr('height', svg_height)
        .append('g')
        .attr('transform', `translate(${chart_margin.left},${chart_margin.top})`);

    //scale
    //水平空間的分配 - 找出最大/最小值並自動縮放
    const xExtent = d3.extent(lineChartData.dates);
    const xScale = d3.scaleTime().domain(xExtent).range([0, chart_width])

    //垂直空間的分配 - 平均分布給各種類
    // const yExtent = [0,lineChartData.yMax];
    const yScale = d3.scaleLinear().domain([0,lineChartData.yMax]).range([chart_height, 0])

    // Draw scatters
    const lineGen = d3.line().x(d=>xScale(d.date)).y(d=>yScale(d.value))
    const chartGroup = this_svg.append('g').attr('class','line-chart')

    chartGroup.selectAll('.line-series').data(lineChartData.series)
        //enter() 出現圖表
        .enter()
        .append('path')
        .attr('class', d=>`line-series ${d.name.toLowerCase()}`)
        .attr('d', d=>lineGen(d.values))
        .style('fill', 'none')
        .style('stroke', d=>d.color)

    function addLabel(axis, label, x, y) {
        /* axis 是呼叫者 - 哪一個軸 */
        axis.selectAll('.tick:last-of-type text')
            .clone()
            .text(label)
            .attr('x', x)
            .attr('y', y)
            .style('text-anchor', 'start')
            .style('font-weight', 'bold')
            .style('fill', '#555');
    }

    // Draw x y軸
    const xAxis = d3.axisBottom(xScale).ticks(5).tickSizeOuter(0)
   
    const xAxisDraw = this_svg.append('g').attr('class', 'x axis')
        .attr('transform', `translate(0,${chart_height+10})`)
        .call(xAxis)
        .call(addLabel, 'Year', 25, 0)

    xAxisDraw.selectAll('text').attr('dy', '2em')

    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(formatTicks)
        .tickSizeInner(-chart_height)
        .tickSizeOuter(0)
    const yAxisDraw = this_svg.append('g').attr('class', 'y axis')
        .attr('transform', `translate(-10,10)`)
        .call(yAxis)
    
    yAxisDraw.selectAll('text').attr('dx', '-2em')

    // Draw Series Label
    // 放在最後一個點點旁邊(x+5,y不變)
    chartGroup.append('g').attr('class','series-labels')
    .selectAll('.series-labels').data(lineChartData.series)
    .enter().append('text')
    .attr('x', d=>xScale(d.values[d.values.length-1].date)+5)
    .attr('y', d=>yScale(d.values[d.values.length-1].value))
    .text(d=>d.name)
    .style('dominant-baseline','central')
    .style('font-size','0.7em').style('font-weight','bold')
    .style('fill',d=>d.color)
    // debugger

    //Draw header
    const header = this_svg.append('g').attr('class', 'bar-header')
        .attr('transform', `translate(0,${-chart_margin.top / 2})`)
        .append('text');
    // header.append('tspan').text('Budget and Revenue over time in $US');
    // header.append('tspan').text('Films w/ budget and revenue figures, 2000-2009')
    //     .attr('x', 0).attr('y', 20).style('font-size', '0.8em').style('fill', 'gray');

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
    // console.log(moviesClean)
    const lineChartData = prepareLineChartData(moviesClean)
    console.log(lineChartData)
    setupCanvas(lineChartData)
}

