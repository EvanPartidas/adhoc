const e = React.createElement;


class EditableProject extends React.Component{
    constructor(props){
        super(props);
        if(props.data){
            this.state = {
                isAddProjectItem: false,
                open: false,
                cloudData: props.data,
                data: props.data,
                filtersString: JSON.stringify(props.data.filters)
            }
        }
        else{
            this.state = {
                open: true,
                isAddProjectItem: true,
                data: {title: "", about: "", date: "", filters: {}, url: ""},
                filtersString: "{\"languages\": [], \"tags\": []}"
            }            
        }
        this.updateData = this.updateData.bind(this);
    }

    toggleDropdown(){

        this.setState({open: !this.state.open});
    }

    cancelEdits(){

        this.setState({open: false, data: this.state.cloudData, filtersString: JSON.stringify(this.state.cloudData.filters)});
    }

    postEdits(){
        if(!this.validJSON(this.state.filtersString))
            return;
        
        console.log('Posting edits...')
        let newData = this.state.data;
        newData = {...newData, filters: JSON.parse(this.state.filtersString)}
        this.setState({data: newData});
        const updateBlogpost = functions.httpsCallable("updateBlogpost");
        updateBlogpost(newData).then((response)=>{
            this.setState({cloudData: newData, open: false});
            console.log(response);
        });
    }

    postCreate(){
        if(!this.validJSON(this.state.filtersString))
            return;
        
        console.log('Posting edits...')
        let newData = this.state.data;
        newData = {...newData,filters: JSON.parse(this.state.filtersString)}
        this.setState({data: newData});
        const createBlogpost = functions.httpsCallable("createBlogpost");
        createBlogpost(newData).then((response)=>{
            this.props.handleDatabaseUpdate();
            console.log(response);
        });
    }

    updateData(data){
        const newData = {...this.state.data, ...data};
        this.setState({data: newData});
    }

    updateJSON(string){
        this.setState({filtersString: string});

    }

    validJSON(string){
        try{
            JSON.parse(string);
            return true;
        }catch(err){return false}
    }

    clearToEmpty(){
        this.setState({data: {title: "", about: "", date: "", filters: {}, url: ""},
            filtersString: "{\"languages\": [], \"tags\": []}"});
    }

    deletePost(){
        let confirmation = confirm(`Do you want to delete ${this.state.data.title}?`);
        if(confirmation){
            const deleteBlogpost = functions.httpsCallable("deleteBlogpost");
            deleteBlogpost(this.state.data).then(()=>{
                this.cancelEdits();
                this.props.handleDatabaseUpdate();
            });
        }
    }
    componentDidUpdate(prevProps) {
        if(prevProps.data && prevProps.data.id !== this.props.data.id){
            this.setState({
                cloudData: this.props.data,
                data: this.props.data,
                filtersString: JSON.stringify(this.props.data.filters)});
        }
    }

    render(){
        let data = this.state.data;
        if(this.state.open){
            return (
                <div >
                    <div className="row " >
                        <div className="col hover-shadow blogpost-listitem">
                            <div className="row">
                                <div className="col-2">
                                    {!this.state.isAddProjectItem && <button onClick={this.postEdits.bind(this)}>Save</button>}
                                    {this.state.isAddProjectItem && <button onClick={this.postCreate.bind(this)}>Add</button>}
                                    {!this.state.isAddProjectItem && <button onClick={this.cancelEdits.bind(this)}>Cancel</button>}
                                    {this.state.isAddProjectItem && <button onClick={this.clearToEmpty.bind(this)}>Clear</button>}
                                    {!this.state.isAddProjectItem && <button onClick={this.deletePost.bind(this)}>Delete</button>}
                                </div>
                                <div className="col-4 text-white">
                                    <input name="Title" placeholder="title..." data-pg-name="Title" value={data.title} onChange={(e)=>this.updateData({title: e.target.value})}/>
                                    <input name="Date" placeholder="date..." data-pg-name="Date" value={data.date} onChange={(e)=>this.updateData({date: e.target.value})}/>
                                </div><div className="col text-left text-white">
                                    <textarea placeholder="about..." style={{width: "100%"}}data-pg-name="About" name="About" value={data.about} onChange={(e)=>this.updateData({about: e.target.value})}></textarea>
                                </div>
                            </div>
                            <div className="row m-1 p-3">
                                    <div className="col">
                                        <label htmlFor="Url">Url:</label>
                                        <input name="Url" placeholder="/project/foo" value={data.url} onChange={(e)=>this.updateData({url: e.target.value})}/>
                                    </div>
                                    <div className="col">
                                        <div className="row">
                                            <div className="col">
                                                <label htmlFor="Filters">Filters:</label>
                                            <input name="Filters" placeholder="{ 'languages':['java'], 'tags': ['tag1', 'tag2']}" value={this.state.filtersString} onChange={(e)=>this.updateJSON(e.target.value)}/>
                                            </div>

                                        </div>
                                        <div className="row">
                                            <div className="col">
                                                {!this.validJSON(this.state.filtersString) && <label>ERR: JSON does not parse</label>}
                                            </div>
                                        </div>

                                    </div>
                            </div>
                        </div>
                    </div>
                </div>);
        }
        return (
            <div onClick={this.toggleDropdown.bind(this)}>
                <div className="row" id="ItemTemplate" >
                    <div className="col">
                        <a className="row hover-shadow blogpost-listitem"> <div className="col-4 text-white">
                                <h4 name="Title" data-pg-name="Title">{data.title}</h4>
                                <p name="Date" data-pg-name="Date">{data.date}</p>
                            </div><div className="col text-left text-white">
                                <p data-pg-name="About" name="About">{data.about}</p>
                            </div> </a>
                    </div>
                </div>
            </div>);
    }
}

class EditProjectWindow extends React.Component{

    constructor(){
        super();
        this.state = {
            blogposts: []
        };
    }

    componentDidMount(){
        console.log("Calling firebase");
        db.collection('projectblogposts').get().then((snapshot)=>{
            console.log("Firebase called");
            let blogs = snapshot.docs.map((doc)=>{
                return {...doc.data(),id: doc.id};
            });
            this.setState({blogposts: blogs});
        });

    }
    
    handleDatabaseUpdate(){
        db.collection('projectblogposts').get().then((snapshot)=>{  
            let blogs = snapshot.docs.map((doc)=>{
                return {...doc.data(),id: doc.id};
            });
            console.log("BLOGPOSTS:",blogs);
            this.setState({blogposts: blogs});
        });
    }

    render(){
        console.log(this.state.blogposts);
        if(this.state.blogposts.length==0)
            return (
                <h1>No blogposts</h1>
            )
        return (
            <div>
            <h1>Edit Blogposts</h1>
            {this.state.blogposts.map((blogpost,index) => <div key={index}><EditableProject data={blogpost} handleDatabaseUpdate={this.handleDatabaseUpdate.bind(this)}/></div>)}
            <EditableProject handleDatabaseUpdate={this.handleDatabaseUpdate.bind(this)}/>
            </div>
        );
    }
}

const domContainer = document.querySelector('#react-content');
const root = ReactDOM.createRoot(domContainer);
root.render(e(EditProjectWindow));