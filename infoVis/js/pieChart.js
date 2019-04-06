let data = {
    datasets: [{   data: [ 89.2, 0.42, 0.69, 0.69, 0.17, 2.59, 3.52, 2.72],
        backgroundColor: ["rgba(0,0,0,0)","#AB917D","#AB917D","#AB917D","#AB917D","#D54E3E", "#A21200", "#D96400" ],
        borderWidth: 0,
        weight: 2,

    },{
        data: [ 89.2, 10.8],
        backgroundColor: ["#EDE0C6","#AB917D" ],
        borderWidth: 0,
        weight: 2,
    },
    ],

    // These labels appear in the legend and in the tooltips when hovering different arcs
    labels: [
        'Sufficient Food',
        'Undernourishment',
        'Middle East & North Africa',
        'Latin America & Caribbeen',
        'North America',
        'East Asia & Pacific',
        'South Asia',
        'Sub-Saharan Africa',
    ],

};

let ctx = document.getElementById('doughnutChart_area').getContext('2d');
let chart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'doughnut',

    // The data for our dataset
    data: data,

    // Configuration options go here
    options: {
        rotation: 2.2 * Math.PI,
        // circumference:2 * Math.PI,
        title: {
            display: false,
            // text: 'Custom Chart Title'
        },
        legend: {
            display: false,
        },
        cutoutPercentage: 60,
    }
});
