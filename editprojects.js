const e = React.createElement;

class EditProjectWindow extends React.Component{

    constructor(){
        super();
        this.state = {
            blogposts: []
        };
    }

    componentDidMount(){
        db.collection('projectblogposts').get().then((snapshot)=>{
            console.log(snapshot.docs);
        });
    }
    
    render(){
        return (
            <h1>Hello</h1>
        )
    }
}

const domContainer = document.querySelector('#react-content');
const root = ReactDOM.createRoot(domContainer);
root.render(e(App));