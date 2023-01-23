const e = React.createElement;

class CalendarContainer extends React.Component{

    constructor(){
        super();
        this.state = {
            days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
            dates: {},
            currentDate: "0/0"
        };
    }

    componentDidMount(){

        const currentDate = new Date();
        //Retrieve Min Unix Time
        let currentWeeksSunday = new Date();
        currentWeeksSunday.setDate(currentDate.getDate()-currentDate.getDay());
        currentWeeksSunday.setHours(0,0,0,0);
        let minUnix = Math.floor(currentWeeksSunday.getTime()/1000);
        let nextWeeksSaturday = new Date();
        nextWeeksSaturday.setDate(currentDate.getDate()+6-currentDate.getDay());
        nextWeeksSaturday.setHours(24,0,0,0);
        nextWeeksSaturday.setDate(nextWeeksSaturday.getDate()+7);
        let maxUnix = Math.floor(nextWeeksSaturday.getTime()/1000);
        const options = {
            hostname: "evanpartidas.com",
            host: "evanpartidas.com",
            method: "POST",
            headers: {
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                query: `{bookabletimeslots(minUnix: ${minUnix},maxUnix: ${maxUnix}){startTimeUnix durationSeconds location}}`,
                variables: {}
            })
        }

        fetch(`https://evanpartidas.com/api/graphql`, options)
            .then(res => res.json())
            .then(({data})=>{
                let {bookabletimeslots = []} = data;
                let newDates = {...this.state.dates};
                for(let i=0;i<bookabletimeslots.length;i++){
                    let {startTimeUnix,durationSeconds} = bookabletimeslots[i];
                    let startTimeDate = new Date();
                    startTimeDate.setTime(startTimeUnix*1000);
                    let dayName = this.state.days[startTimeDate.getDay()];
                    if(!newDates[dayName]){
                        newDates[dayName] = {};
                    }
                    let dayMonth = `${startTimeDate.getMonth()+1}/${startTimeDate.getDate()}`;
                    if(!newDates[dayName][dayMonth]){
                        newDates[dayName][dayMonth] = [];
                    }
                    let startTimeStr = startTimeDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                    let endTimeDate = new Date(startTimeDate);
                    endTimeDate.setTime((startTimeUnix+durationSeconds)*1000);
                    let endTimeStr = endTimeDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                    newDates[dayName][dayMonth].push({time: `${startTimeStr} - ${endTimeStr}`,startTimeUnix});
                }

                this.setState({dates: newDates});

            }).catch(err=>{console.error(err)});

        //Fill out default values until request finishes
        let newDates = {};
        for(let i=0;i<7;i++)
        {
            let dayName = this.state.days[i];
            let tmpDate = new Date();
            tmpDate.setDate(tmpDate.getDate() + (i-tmpDate.getDay()));
            let month = tmpDate.getMonth()+1;
            let dayOfMonth = tmpDate.getDate();
            newDates[dayName] = {};
            let thisWeekDate = `${month}/${dayOfMonth}`;
            newDates[dayName][thisWeekDate] = [];

            tmpDate.setDate(tmpDate.getDate() + 7);
            month = tmpDate.getMonth()+1;
            dayOfMonth = tmpDate.getDate();
            let nextWeekDate = `${month}/${dayOfMonth}`;
            newDates[dayName][nextWeekDate] = [];
        }
        let tmpDate = new Date();
        let month = tmpDate.getMonth()+1;
        let dayOfMonth = tmpDate.getDate();
        this.setState({dates: newDates, currentDate: `${month}/${dayOfMonth}`});
        
    }

    render(){
        if(this.state.days.length!=7)
            return (
                <h1>Error :(</h1>
            )
        return (
            <div className="row calendar-container">
                {this.state.days.map((day,index)=>
                {
                if(index==0||index==6)
                {
                    if(this.state.dates[day]==null)
                        return (<div key={index} style={{display: 'none'}}></div>);
                    let display = false;
                    for(let date in this.state.dates[day])
                    {
                        if(this.state.dates[day][date].length>0)
                            display = true;
                    }
                    if(!display)
                        return (<div key={index} style={{display: 'none'}}></div>);
                }
                
                return (
                <div key={index} className="col calendar-day m-1 p-3" id={this.state.dates[day]&&this.state.dates[day][this.state.currentDate]?"currentDay":null}>
                    <div className="row">
                                <div className="col"><h3>{day}</h3></div>
                    </div>
                    
                    <div className="row calendar-outterblock">
                        <div className="col">
                        {
                            this.state.dates[day]? Object.keys(this.state.dates[day]).map((date) =>
                                <div className="row" style={{'padding':'10%'}} key={date}>
                                    <div className="col">
                                    <div className="row">
                                        <div className="col">
                                            <h4>{date}</h4>
                                        </div>
                                    </div>
                                    <div className="col">
                                    {this.state.dates[day][date].length>0?
                                    this.state.dates[day][date].map((timeblock,index)=>    
                                    <div className="row" /*style={{margin: 'auto'}}*/ key={index}>
                                        <a href={"/tutoring/payment?bookableStartTime="+timeblock.startTimeUnix}>
                                        <div className="col calendar-innerblock border rounded"><h5>{timeblock.time}</h5></div>
                                        </a>
                                    </div>
                                    )
                                    :
                                    <div className="row" /*style={{margin: 'auto'}}*/>
                                        <div className="col calendar-innerblock "><h5>None</h5></div>
                                    </div>
                                    }
                                    </div>
                                    </div>
                                </div>
                            ):<div></div>
                        }
                        </div>
                    </div>
                </div>);
                }
                )}
            </div>
        );
    }
}

const domContainer = document.querySelector('#react-calendar');
const root = ReactDOM.createRoot(domContainer);
root.render(e(CalendarContainer));

var observer = new IntersectionObserver(function(entries) {
	if(entries[0].isIntersecting === true)
    {
        document.querySelector('#currentDay').scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
}, { root:null,threshold: [0.40]});
observer.observe(domContainer);