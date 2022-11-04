const e = React.createElement;



function unixToDate(unix){
    let ret = new Date();
    ret.setTime(unix*1000);
    return ret;
}


function dateToHMA(date, hour12){
	return date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12});
}

class PaymentWindow extends React.Component{

    constructor(){
        super();
        this.state = {
            loading: true,
            state: "edit"
        };
    }

    componentDidMount(){
        let params = (new URL(document.location)).searchParams;
        let clientSecret = params.get("payment_intent_client_secret");
        const options = {
            hostname: "evanpartidas.com",
            host: "evanpartidas.com",
            method: "POST",
            headers: {
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                query: `{tutoringpayment(paymentId: "${clientSecret}"){paymentId amount startTimeUnix durationSeconds email name}}`,
                variables: {}
            })
        }

        if(clientSecret)
        fetch(`https://evanpartidas.com/api/graphql`, options)
            .then(res => res.json())
            .then(({data})=>{
                this.setState({loading: false, payment: data.tutoringpayment});
            }).catch(err=>{console.error(err)});
        else
            this.setState({loading: false});
    }

    render(){
        let days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

        if(this.state.loading){
            return (<div><h2>Loading...</h2></div>);
        }
        if(this.state.payment){
            let date = unixToDate(this.state.payment.startTimeUnix);
            return (<div>
                <h2>Payment Found.</h2>
                <div>
                    <p>Your Payment Id is: {this.state.payment.paymentId}</p><br/>
                    <p>Thank you, {this.state.payment.name}!</p>
                    <p>See you on {days[date.getDay()]} ({date.getMonth()+1}/{date.getDate()}) at {dateToHMA(date)}.</p>
                </div>

            </div>);
        }
        return (<div><h2>Payment Not Found. Try Refreshing.</h2></div>);
    }
}

const domContainer = document.querySelector('#react-payment-info-window');
const root = ReactDOM.createRoot(domContainer);
root.render(e(PaymentWindow));
