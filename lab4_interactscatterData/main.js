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

function prepareScattertData(data) {
    return data.sort((a, b) => b.budget - a.budget)
        .filter((d, i) => i < 100)
}

function setupCanvas(scatterData) {
    const svg_width = 1000
    const svg_height = 500
    const chart_margin = { top: 40, bottom: 40, right: 40, left: 80 }
    const chart_width = svg_width - (chart_margin.left + chart_margin.right)
    const chart_height = svg_height - (chart_margin.top + chart_margin.bottom)

    // Scatter base
    const this_svg = d3.select('.scatter_plot_container').append('svg')
        .attr('width', svg_width).attr('height', svg_height)
        .append('g')
        .attr('transform', `translate(${chart_margin.left},${chart_margin.top})`)

    //scale
    //水平空間的分配 - 找出最大/最小值並自動縮放
    const xExtent = d3.extent(scatterData, d => d.budget);
    const xScale = d3.scaleLinear().domain(xExtent).range([0, chart_width])

    //垂直空間的分配 - 平均分布給各種類
    const yExtent = d3.extent(scatterData, d => d.revenue);
    const yScale = d3.scaleLinear().domain(yExtent).range([chart_height, 0])

    // Draw scatters
    this_svg.selectAll('.scatter').data(scatterData)
        //enter() 出現圖表
        .enter()
        .append('circle')
        .attr('class', 'scatter')
        .attr('cx', d => xScale(d.budget))
        .attr('cy', d => yScale(d.revenue))
        .attr('r', 3)
        .style('fill', 'dodgerblue')
        .style('fill-opacity', 0.5)

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

    // x y軸
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(formatTicks)
        .tickSizeInner(-chart_height)
        .tickSizeOuter(0)

    const xAxisDraw = this_svg.append('g').attr('class', 'x axis')
        .attr('transform', `translate(-10,${chart_height+10})`)
        .call(xAxis)
        .call(addLabel, 'Budget', 25, 0)

    xAxisDraw.selectAll('text').attr('dy', '2em')

    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(formatTicks)
        .tickSizeInner(-chart_width)
        .tickSizeOuter(0)
    const yAxisDraw = this_svg.append('g').attr('class', 'y axis')
        .attr('transform', `translate(-10,10)`)
        .call(yAxis)
        .call(addLabel, 'Revenue', -25.0, -30)

    yAxisDraw.selectAll('text').attr('dx', '-2em')

    //Draw header
    // const header = this_svg.append('g').attr('class', 'bar-header')
    //     .attr('transform', `translate(0,${-chart_margin.top / 2})`)
    //     .append('text');
    // header.append('tspan').text('Budget vs. Revenue in $US');
    // header.append('tspan').text('Top 100 films by budget, 2000-2009')
    //     .attr('x', 0).attr('y', 20).style('font-size', '0.8em').style('fill', 'gray');

    function formatTicks(d) {
        return d3.format('~s')(d)
            .replace('M', 'mil')
            .replace('G', 'bil')
            .replace('T', 'til')
    }

    function brushed(e) {
        // debugger;
        if (e.selection) {
            // 選取範圍
            const [[x0, y0], [x1, y1]] = e.selection
            // 那些資料有落在範圍中
            const selected = scatterData.filter(
                d =>
                    x0 <= xScale(d.budget) && xScale(d.budget) < x1 &&
                    y0 <= yScale(d.revenue) && yScale(d.revenue) < y1
            )
            // console.log(selected) // 確認是否能抓到資料
            updateSelected(selected)
            highlightSelected(selected)
        } else {
            d3.select('.selected-body').html('')
            highlightSelected([])
        }

        function mouseoverListItem() {
            selectedId = d3.select(this).data()[0].id
            d3.selectAll('.scatter')
                .filter(d => d.id === selectedId)
                .transition().attr('r', 6)
                .style('fill', 'red')

        }
        function mouseoutListItem() {
            selectedId = d3.select(this).data()[0].id
            d3.selectAll('.scatter')
                .filter(d => d.id === selectedId)
                .transition().attr('r', 3)
                .style('fill', 'green')
        }


        function updateSelected(data) {
            d3.select('.selected-body').selectAll('.selected-element')
                .on('mouseover', mouseoverListItem)
                .on('mouseout', mouseoutListItem)
                .data(data, d => d.id).join(
                    enter => {
                        enter.append('p').attr('class', 'selected-element')
                            .html(d => `<span class="selected-title">${d.title}</span>,
                                ${d.release_year}
                                <br>budget:${formatTicks(d.budget)} | revenue: ${formatTicks(d.revenue)}`)
                    },
                    update => {
                        update
                    },
                    exit => {
                        exit.remove()
                    }
                )

        }

        function highlightSelected(data) {
            const selectedIds = data.map(d => d.id)
            d3.selectAll('.scatter').filter(d => selectedIds.includes(d.id))
                .style('fill', 'green')

            d3.selectAll('.scatter').filter(d => !selectedIds.includes(d.id))
                .style('fill', 'dodgerblue')
        }

    }
    // add brush
    const brush = d3.brush().extent([[0, 0], [svg_width, svg_height]]).on('brush end', brushed)
    this_svg.append('g').attr('class', 'brush').call(brush)

    d3.select('.selected-container')
        .style('width', `1000px`)
        .style('height', `300px`)
        // .style('margin','0';)

}

// Main 顯示篩選後資料
function ready(movies) {
    const moviesClean = filterData(movies)
    // console.log(moviesClean)
    const scatterData = prepareScattertData(moviesClean)
    console.log(scatterData)
    setupCanvas(scatterData)
}



