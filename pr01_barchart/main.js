// 資料取得
d3.csv('data/movies.csv',type).then(
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

// 資料篩選
function filterData(data){
    return data.filter(
        d => {
            return(
                d.release_year > 1999 && d.release_year < 2010 &&
                d.revenue > 0 &&
                d.budget > 0 &&
                d.genre &&
                d.title

            )
        }
    )
}

function prepareBarChartData(data){
    console.log(data)
    // 分組篩選後資料
    const dataMap = d3.rollup(data, 
                              v => d3.sum(v, d => d.revenue),
                              d => d.genre, 
                              )
    const dataArray = Array.from(dataMap, d =>({genre:d[0], revenue:d[1]}))
    // debugger
    return dataArray

}

function setupCanvas(barChartData){
    const svg_width  = 700
    const svg_height = 500
    const chart_margin = {top:40, bottom:40, right:40, left: 80} 
    const chart_width = svg_width-(chart_margin.left+chart_margin.right)
    const chart_height = svg_height-(chart_margin.top+chart_margin.bottom)

    const this_svg = d3.select('.bar_chart_container').append('svg')
    .attr('width',svg_width).attr('height',svg_height)
    .append('g').attr('transform',`translate(${chart_margin.left},${chart_margin.top})`);

    //scale
    //水平空間的分配 - 找出最大/最小值並自動縮放
    //V1.寫法1. d3.extent() : find the max & min in revenue 找最大/最小值
    const xExtent = d3.extent(barChartData, d=>d.revenue);
    // domain: 資料 range:實際上要放東西的地方
    const xScale_v1 = d3.scaleLinear().domain(xExtent).range([0,chart_width])
    //V2.寫法2 d3.max()
    const xMax = d3.max(barChartData, d=>d.revenue);
    const xScale_v2 = d3.scaleLinear().domain([0, xMax]).range([0,chart_width]);
    //V3. 簡寫 Short writing for v2
    const xScale_v3 = d3.scaleLinear([0,xMax],[0, chart_width]);
    // Short writing for v1
    const xScale_v4 = d3.scaleLinear(xExtent,[0, chart_width]);

    //垂直空間的分配 - 平均分布給各種類
    const yScale = d3.scaleBand().domain(barChartData.map(d=>d.genre))
                                 .rangeRound([0, chart_height])
                                 .paddingInner(0.25); // bar之間的距離

    const bars = this_svg.selectAll('.bar').data(barChartData)
                                            //enter() 出現圖表
                                           .enter()
                                           .append('rect')
                                                .attr('class','bar')
                                                .attr('x',0)
                                                .attr('y',d=>yScale(d.genre))
                                                .attr('width',d=>xScale_v4(d.revenue))
                                                .attr('height',yScale.bandwidth())
                                                .style('fill','dodgerblue')

//Draw header
const header = this_svg.append('g').attr('class','bar-header')
                                    .attr('transform',`translate(0,${-chart_margin.top/2})`)
                                    .append('text');
// header.append('tspan').text('Total revenue by genre in $US');
// header.append('tspan').text('Years:2000-2009')
//                         .attr('x',0).attr('y',20).style('font-size','0.8em').style('fill','gray');

// x y軸
const xAxis = d3.axisTop(xScale_v3).tickFormat(formatTicks)
                .tickSizeInner(-chart_height)
                .tickSizeOuter(0)
               
const xAxisDraw = this_svg.append('g').attr('class','x axis').call(xAxis)

const yAxis = d3.axisLeft(yScale).tickSize(0)
const yAxisDraw = this_svg.append('g').attr('class','y axis').call(yAxis)
yAxisDraw.selectAll('text').attr('dx','-0.6em')

function formatTicks(d){
    return d3.format('~s')(d)
    .replace('M','mil')
    .replace('G','bil')
    .replace('T','til')
}

}

// Main 顯示篩選後資料
function ready(movies){
    const moviesClean = filterData(movies)
    // console.log(moviesClean)
    // 排序分組後資料
    const barChartData = prepareBarChartData(moviesClean).sort(
        (a,b) => {
            return d3.descending(a.revenue, b.revenue) // 降冪排法
            return d3.ascending(a.revenue, b.revenue) // 升冪排法
            // return b.revenue - a.revenue 不用d3的降冪寫法
        }
    )
    console.log(barChartData)
    setupCanvas(barChartData)
}


