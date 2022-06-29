const friends = {
    john: ['Apple', '','Orange','', 'Lemon'],
    marry: ['Apple','', 'Orange'],
    ryan: ['Apple','', 'Cherry','', 'Peach','', 'Orange']
};

const thisSVG = d3.select('svg');

d3.selectAll('button').on('click', click);

// practice: use keyboard to control
// hint: Object.keys(friends)[2]

function click() {
    const thisFruitList = friends[this.dataset.name];
    update(thisFruitList);
}

function update(data) {
    thisSVG.selectAll('text')
        .data(data, d => d)
        .join(
            enter => {
                enter.append('text').text(d => d)
                    .attr('x', -100).attr('y', (d, i) => 50 + i * 30)
                    .style('fill', 'green').style('font-size','larger')
                    .transition().attr('x', 30)
            },
            update => {
                update.transition()
                    .style('fill', 'red').style('font-size','larger').attr('y', (d, i) => 50 + i * 30)
            },
            exit => {
                exit.transition()
                    .attr('x', 500)
                    .style('fill', 'yellow').style('font-size','larger').remove()
            }
        )
}