const e = React.createElement;

function setTimeToHMS(dateObj, hhmmss){//Set Hour,Minutes,Seconds
    if(/[0-9]{2}:[0-9]{2}/.test(hhmmss)){
        let [hours,minutes] = hhmmss.split(":");
        dateObj.setHours(+hours);//must be a number
        dateObj.setMinutes(minutes);
        dateObj.setSeconds(0);
        return true;
    }
    if(!/([0-9]{2}:){2}[0-9]{2}/.test(hhmmss)){
        return false;
    }
    let [hours,minutes,seconds] = hhmmss.split(":");
    dateObj.setHours(+hours);//must be a number
    dateObj.setMinutes(minutes);
    dateObj.setSeconds(seconds);
    return true;
}

function unixToDate(unix){
    let ret = new Date();
    ret.setTime(unix*1000);
    return ret;
}

function dateToHMA(date, hour12){
	return date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12});
}

class SchedulingWindow extends React.Component{

    constructor(){
        super();
        this.state = {
            loading: true,
            state: "edit"
        };
    }

    componentDidMount(){
        let params = (new URL(document.location)).searchParams;
        let bookableStartTime = params.get("bookableStartTime");
        const options = {
            hostname: "evanpartidas.com",
            host: "evanpartidas.com",
            method: "POST",
            headers: {
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                query: `{bookabletimeslot(startTimeUnix: ${bookableStartTime}){startTimeUnix durationSeconds location price}}`,
                variables: {}
            })
        }


        fetch(`https://evanpartidas.com/api/graphql`, options)
            .then(res => res.json())
            .then(({data})=>{
                let sessionPrice = data.bookabletimeslot.durationSeconds/3600 * (data.bookabletimeslot.price);
                this.setState({loading: false, timeSlot: data.bookabletimeslot,sessionPrice});
            }).catch(err=>{console.error(err)});
        
    }
    async fetchPaymentIntent(){
        let bodyContent = {customerTimeBlock: this.state.customerTimeBlock, availableBlockStartTime: this.state.timeSlot.startTimeUnix};
        const response = await fetch("/api/tutoring/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyContent),
        }).catch((err)=>{console.log(err)});
	const json = await response.json();
	console.log(json);
        const { clientSecret } = json;
        const appearance = {
            theme: 'night',
            variables: {
                colorPrimary: '#808080',
            },
        };
        let elements = stripe.elements({ appearance, clientSecret });
        
        const paymentElement = elements.create("payment");
        waitForEl("#payment-element",()=>{paymentElement.mount("#payment-element")});
        if(this.state.state==="pay")//Because it's async, make sure we're on the right state
            this.setState({stripeElements: elements});
    }

    handleInputFormSubmit(e){
        e.preventDefault();
        //Check if there is an error and disply that error in an alert
        if(this.state.error){
            alert(`Fix Error: ${this.state.errorMsg}`);
            return;
        }
        this.setState({state: "verify"});
    }
    handleFormChange(e){
        
        //Get Duration Of Tutoring Session
        let timeSlot = this.state.timeSlot;
        let startTime = new Date();
        startTime.setTime(timeSlot.startTimeUnix*1000);
        let endTime = new Date();
        endTime.setTime((timeSlot.startTimeUnix+timeSlot.durationSeconds)*1000);
        if(!setTimeToHMS(startTime, e.target.form['starttime'].value)){
            let error=true;
            let errorMsg="Please Select Start Time";
            this.setState({error,errorMsg});
            return;
        }
        if(!setTimeToHMS(endTime, e.target.form['endtime'].value)){
            let error=true;
            let errorMsg="Please Select End Time";
            this.setState({error,errorMsg});
            return;
        }
        //Calculate
        let sessionDurationSeconds = Math.floor((endTime.getTime() - startTime.getTime())/1000);

        //Get Price Of Tutoring Session
        let sessionPrice = (sessionDurationSeconds/3600)*this.state.timeSlot.price;

        let error = false;
        let errorMsg = null;

        //Check if layout is invalid
        if(sessionDurationSeconds<3600){
            error = true;
            errorMsg = "Tutoring Session must be at least one hour.";
        }
        else if(sessionDurationSeconds%(15*60)){
            error = true;
            errorMsg = "Times must be in increments of 15 minutes";
        }
        else if(startTime.getTime()/1000<timeSlot.startTimeUnix){
            error = true;
            let date = new Date();
            date.setTime(timeSlot.startTimeUnix*1000);
            errorMsg = `Earliest Start Time: ${date.toLocaleTimeString()}`;
        }
        else if(endTime.getTime()/1000>timeSlot.startTimeUnix+timeSlot.durationSeconds){
            error = true;
            let date = new Date();
            date.setTime((timeSlot.startTimeUnix+timeSlot.durationSeconds)*1000);
            errorMsg = `Latest End Time: ${date.toLocaleTimeString()}`;
        }

        //Create time block
        let customerTimeBlock = {};
        customerTimeBlock.durationSeconds = sessionDurationSeconds;
        customerTimeBlock.startTimeUnix = startTime.getTime()/1000;
        customerTimeBlock.name = e.target.form['name'].value;
        customerTimeBlock.email = e.target.form['email'].value;
        customerTimeBlock.location = e.target.form['location'].value;

        this.setState({sessionDurationSeconds,sessionPrice,error,errorMsg,customerTimeBlock});

    }

    async stripeFormSubmit(e){
        if(e){
            e.preventDefault();
        }
	let elements = this.state.stripeElements
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
            // Make sure to change this to your payment completion page
		    return_url: `https://evanpartidas.com/tutoring/paymentcompleted`,
            },
        });
	console.log(error);
        if (error.type === "card_error" || error.type === "validation_error") {
            alert(error.message);
        } else {
            alert("An unexpected error occurred.");
        }
    }

    render(){
        let days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        if(this.state.loading){
            return (
                <div>
                    <h2>Loading...</h2>
                </div>
            );
        }
        if(!this.state.timeSlot){
            return (
                <div>
                    <h2>Time Slot Not Found.</h2>
                </div>
            );
        }
        if(this.state.state==="edit"){
            let customerTimeBlock = this.state.customerTimeBlock;
            let timeSlot = this.state.timeSlot;
            let startTime = unixToDate(timeSlot.startTimeUnix);
            let startTimeStr = dateToHMA(startTime,false);
            let endTime = unixToDate(timeSlot.startTimeUnix+timeSlot.durationSeconds);
            let endTimeStr = dateToHMA(endTime,false);
            return (
                <div>
                    <div className="row"><div className="col"><h2>Booking For {days[startTime.getDay()]}, {startTime.getMonth()+1}/{startTime.getDate()}</h2></div></div>
                <form className="row" onSubmit={this.handleInputFormSubmit.bind(this)} onChange={this.handleFormChange.bind(this)}>

                    <div className="col" >
                        {this.state.error?<div className="row"><h2 style={{color: 'red'}}>{this.state.errorMsg}</h2><div className="col"></div></div>:null}
                        <div className="row">
                            <div className="col m-3">
                                <div className="row form-card rounded">
                                    <div className="col my-auto text-left">
                                        <label htmlFor="name">Name</label>
                                    </div>
                                    <div className="col my-auto text-right">
                                        <input type="text" defaultValue={customerTimeBlock?customerTimeBlock.name:null} name="name" placeholder="Bob" required/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col m-3">
                                <div className="row form-card rounded">
                                    <div className="col my-auto text-left">
                                        <label htmlFor="email">Email</label>
                                    </div>
                                    <div className="col my-auto text-right">
                                        <input type="email" defaultValue={customerTimeBlock?customerTimeBlock.email:null} name="email" placeholder="Bob@rob.com" required/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col m-3">
                                <div className="row form-card rounded">
                                    <div className="col my-auto text-left">
                                        <label htmlFor="location">Location</label>
                                    </div>
                                    <div className="col my-auto text-right">
                                        <select name="location" defaultValue={customerTimeBlock?customerTimeBlock.location:null}>
                                            {this.state.timeSlot.location.map((item,index)=>
                                                <option key={item} value={item}>{item}</option>
                                            )}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col m-3">
                                <div className="row form-card rounded">
                                    <div className="col my-auto text-left">
                                        <label htmlFor="starttime">Start Time</label>
                                    </div>
                                    <div className="col my-auto text-right">
                                        <input type="time" name="starttime" min={startTimeStr} defaultValue={customerTimeBlock?unixToDate(customerTimeBlock.startTimeUnix).toLocaleTimeString('en-US',{hour12: false}):startTimeStr} step="900"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col m-3">
                                <div className="row form-card rounded">
                                    <div className="col my-auto text-left">
                                        <label htmlFor="endtime">End Time</label>
                                    </div>
                                    <div className="col my-auto text-right">
                                        <input type="time" name="endtime" max={endTimeStr} defaultValue={customerTimeBlock?unixToDate(customerTimeBlock.startTimeUnix+customerTimeBlock.durationSeconds).toLocaleTimeString('en-US',{hour12: false}):endTimeStr} step="900"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row form-card rounded">
                            <div className="col my-auto">
                                <label >Price: {this.state.error?"Fix Error":"$"+Math.round(this.state.sessionPrice).toFixed(2)}</label>
                            </div>
                            <div className="col my-auto">
                                <input className="btn-evan" type="submit" value="Next"/>
                            </div>
                        </div>

                    </div>
                </form>
                </div>
            );
        }
        if(this.state.state === "verify"){//People can verify the data they entered is correct
            let customerTimeBlock = this.state.customerTimeBlock;
            let startTime = unixToDate(customerTimeBlock.startTimeUnix);
            let startTimeStr = dateToHMA(startTime,true);
            let endTime = unixToDate(customerTimeBlock.startTimeUnix+customerTimeBlock.durationSeconds);
            let endTimeStr = dateToHMA(endTime,true);
            return (
            <div>
                <div className="row"><div className="col"><h2>Booking For {days[startTime.getDay()]}, {startTime.getMonth()+1}/{startTime.getDate()}</h2></div></div>
                <div className="row form-card rounded">
                    <div className="col">
                        <div className="row rounded data-row m-3">
                            <div className="col text-left">
                                <h2>Name: </h2>
                            </div>
                            <div className="col text-right">
                                <h2>{customerTimeBlock.name}</h2>
                            </div>
                        </div>
                        <div className="row rounded data-row m-3 flex-nowrap">
                            <div className="col text-left mr-5">
                                <h2>Email:</h2>
                            </div>
                            <div className="col text-right">
                                <h2>{customerTimeBlock.email}</h2>
                            </div>
                        </div>
                        <div className="row rounded data-row m-3">
                            <div className="col text-left">
                                <h2>Location: </h2>
                            </div>
                            <div className="col text-right">
                                <h2>{customerTimeBlock.location}</h2>
                            </div>
                        </div>
                        <div className="row rounded data-row m-3">
                            <div className="col text-left">
                                <h2>Start Time: </h2>
                            </div>
                            <div className="col text-right">
                                <h2>{startTimeStr}</h2>
                            </div>
                        </div>
                        <div className="row rounded data-row m-3">
                            <div className="col text-left">
                                <h2>End Time: </h2>
                            </div>
                            <div className="col text-right">
                                <h2>{endTimeStr}</h2>
                            </div>
                        </div>
                        <div className="row rounded data-row m-3">
                            <div className="col text-left">
                                <h2>Price: </h2>
                            </div>
                            <div className="col text-right">
                                <h2>${Math.round(this.state.sessionPrice).toFixed(2)}</h2>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col">
                                <button className="btn-evan" onClick={()=>this.setState({state: "edit"})}>Back</button>
                            </div>
                            <div className="col">
                                <button className="btn-evan" onClick={()=>this.setState({state: "pay"})}>Next</button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            );
        }
        if(this.state.state==="pay"){
            if(!this.state.stripeElements){
                this.fetchPaymentIntent();
                //Not allowing people to go back until their payment intent is ready.
                //Helps with async problems
                return (
                    <div>
                        Loading...
                    </div>
                );
            }
            
            let stripeElements = this.state.stripeElements;
            let customerTimeBlock = this.state.customerTimeBlock;
            let startTime = unixToDate(customerTimeBlock.startTimeUnix);
            let endTime = unixToDate(customerTimeBlock.startTimeUnix+customerTimeBlock.durationSeconds);
            return (
                <div>
                <div className="row"><div className="col"><h2>Booking For {days[startTime.getDay()]}, {startTime.getMonth()+1}/{startTime.getDate()}</h2></div></div>
                <form className="row form-card rounded mb-3">
                <div id="payment-element" className="col">
                    {/*<!--Stripe.js injects the Payment Element-->*/}
                </div>
                <div id="payment-message" className="hidden"></div>
                </form>
                <div className="row form-card rounded">
                    <div className="col-6">
                        <button className="btn-evan" style={{width: "50%"}} onClick={()=>{
                            this.setState({state: "verify"}); 
                            this.state.stripeElements = null;
                    }}>Back</button>
                    </div>
                    <div className="col-6">
                        <button className="btn-evan" style={{width: "50%"}} onClick={this.stripeFormSubmit.bind(this)}>Pay</button>
                    </div>
                </div>
            </div>
            );
        }
        return (<div><h2>Something wong :(</h2></div>);
    }
}

const domContainer = document.querySelector('#react-scheduling-window');
const root = ReactDOM.createRoot(domContainer);
root.render(e(SchedulingWindow));
