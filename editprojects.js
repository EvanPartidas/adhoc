const e = React.createElement;

//Class for the individual items in the list
class EditableProject extends React.Component{
    constructor(props){
        super(props);
        if(props.data){//The creation component will not have data
            this.state = {
                isAddProjectItem: false, //A quick variable to check if this component is for creation or not
                open: false,//Whether or not the project is currently being edited
                cloudData: props.data, //The data that matches what is currently in the cloud
                data: props.data, //The current data (edited)
                filtersString: JSON.stringify(props.data.filters) //a string to use for the filters as objects would be buggy to work with
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
	//Detoggle the dropdown and clear edited data
    cancelEdits(){

        this.setState({open: false, data: this.state.cloudData, filtersString: JSON.stringify(this.state.cloudData.filters)});
    }
	//Send the edits to the cloud
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
	//Create a new post
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
	//Update one of the simple data attributes
    updateData(data){
        const newData = {...this.state.data, ...data};
        this.setState({data: newData});
    }
	//Update the filters attribute
    updateJSON(string){
        this.setState({filtersString: string});

    }
	//Simple function to check if the JSON data is valid
    validJSON(string){
        try{
            JSON.parse(string);
            return true;
        }catch(err){return false}
    }

    //Used for the creation component, simply blanks everthing
    clearToEmpty(){
        this.setState({data: {title: "", about: "", date: "", filters: {}, url: ""},
            filtersString: "{\"languages\": [], \"tags\": []}"});
    }
	//Delete a blogpost
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
    //This function is essential, if the props get updated, the state will not. Most likely due to react saving CPU by not reconstructing all the react components.
    componentDidUpdate(prevProps) {
        if(prevProps.data && prevProps.data.id !== this.props.data.id){
            this.setState({
                cloudData: this.props.data,
                data: this.props.data,
                filtersString: JSON.stringify(this.props.data.filters)});
        }
    }
	//Loads of html
    render(){
        let data = this.state.data;
        if(this.state.open){//Is the item dropped down or not
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
        return (//If not dropped down, just display some basic info
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
//Container class for all the different blogposts
class EditProjectWindow extends React.Component{

    constructor(){
        super();
        this.state = {
            blogposts: []
        };
    }

    componentDidMount(){
        db.collection('projectblogposts').get().then((snapshot)=>{
            let blogs = snapshot.docs.map((doc)=>{
                return {...doc.data(),id: doc.id};
            });
            this.setState({blogposts: blogs});
        });

    }
    //Repoll the database to get the most updated version
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