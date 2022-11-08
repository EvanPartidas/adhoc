const e = React.createElement;

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

class BlogPostSearch extends React.Component {

    constructor() {
        super();
        this.state = {
            view: 1,
        };
    }

    componentDidMount() {
        db.collection('projectblogposts').get().then((snapshot) => {
            let blogposts = snapshot.docs.map((doc) => {
                return { id: doc.id, ...doc.data() };
            });
            console.log(blogposts);

            let filters = {};
            if (blogposts)
                for (let i = 0; i < blogposts.length; i++) {
                    for (const filterKey in blogposts[i].filters) {
                        if (!filters[filterKey]) {
                            filters[filterKey] = new Set();
                        }
                        for (let j = 0; j < blogposts[i].filters[filterKey].length; j++)
                            filters[filterKey].add(blogposts[i].filters[filterKey][j]);
                    }
                }
            for (const filterKey in filters) {
                filters[filterKey] = Array.from(filters[filterKey]);
            }
            this.setState({ blogposts, filters });
        }).catch(err => {
            console.log(err);
        });
    }

    filterFormUpdate(e) {
        let form = e.target.form;
        let filters = this.state.filters;
        let selectedFilers = {};
        for (let filterKey in filters) {
            for (let i = 0; i < filters[filterKey].length; i++) {
                let option = filters[filterKey][i];
                if (form[option].checked) {
                    if (!selectedFilers[filterKey]) {
                        selectedFilers[filterKey] = [];
                    }
                    selectedFilers[filterKey].push(option);
                }
            }
        }
        this.setState({ selectedFilers });
    }

    render() {
        let blogposts = this.state.blogposts;
        let view = this.state.view;
        let selectedFilers = this.state.selectedFilers;
        let filters = this.state.filters||{};
        return (
            <div>
                <div className="mobile-only blogpost-nav">
                    <span className={"nav-item " + (view == 0 ? "active" : "")} onClick={() => { this.setState({ view: 0 }) }}><h4>Filters</h4></span>
                    <span className={"nav-item " + (view == 1 ? "active" : "")} onClick={() => { this.setState({ view: 1 }) }}><h4>Projects</h4></span>
                </div>
                <div className="blogpost-container">
                    <div className={"" + view == 0 ? "mobile-show" : null}>
                        <form onChange={this.filterFormUpdate.bind(this)}>
                            {
                                Object.keys(filters).map((filterKey) => {
                                    return (
                                        <div key={filterKey}>
                                            <h3>{toTitleCase(filterKey)}</h3>
                                            {filters[filterKey].map(filterOption =>
                                            (<div key={filterOption} className="filter-checkbox">
                                                <label htmlFor={filterOption}>{filterOption}</label>
                                                <input name={filterOption} type="checkbox" value={filterOption} />
                                            </div>)
                                            )}
                                        </div>
                                    );
                                })
                            }
                        </form>
                    </div>
                    <div className={"" + view == 1 ? "mobile-show" : null}>
                        {
                            blogposts && blogposts.map((blogpost) => {
                                //Determine whether or not to display this blogpost
                                if (selectedFilers && Object.keys(selectedFilers).length) {
                                    let display = false;
                                    for (let filterKey in selectedFilers) {
                                        let intersection = _.intersection(blogpost.filters[filterKey], selectedFilers[filterKey]);
                                        if (intersection.length) {
                                            display = true;
                                        }
                                    }
                                    if (!display)
                                        return (
                                            <div key={blogpost.id} style={{ display: "none" }}></div>
                                        );
                                }
                                return (
                                    <div key={blogpost.id} className="card blogpost-item">
                                        <div>
                                            <h3><a style={{color: "white"}}href={blogpost.url}>{blogpost.title}</a></h3>
                                            <h5>{blogpost.date}</h5>
                                        </div>
                                        <div>
                                            <p>{blogpost.about}</p>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
        );
    }
}

const domContainer = document.querySelector('#react-blogpost-viewer');
const root = ReactDOM.createRoot(domContainer);
root.render(e(BlogPostSearch));