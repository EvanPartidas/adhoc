const e = React.createElement;

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

function titleToId(str) {
    return str.replace(
        /\s/,
        ""
    ).toLowerCase();

}

/*
jsonBlog{
    title: "Title",
    id: "id", //Non-obfuscated Plaintext
    about: "Description",
    monthYear: "mm/yyyy",
    filters: {},


}
*/

class BlogPost extends React.Component {

    constructor() {
        super();
        this.state = {
            loading: true,
            displayModal: false,
        };
    }

    componentDidMount() {
        /*Fetch Data*/

        let params = (new URL(document.location)).searchParams;
        let blogid = params.get("id");
        const options = {
            hostname: "evanpartidas.com",
            host: "evanpartidas.com",
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query: `{blogpost(id: "${blogid}"){id title about body{ sectionTitle sectionContent}}}`,
                variables: {}
            })
        }


        fetch(`https://evanpartidas.com/api/graphql`, options)
            .then(res => res.json())
            .then(({ data }) => {
                this.setState({ loading: false, blogpost: data.blogpost });
            }).catch(err => { console.error(err) });
    }
    componentDidUpdate() {
        //Highlight code that loaded in
        hljs.highlightAll();
    }
    render() {
        const blogpost = this.state.blogpost;
        console.log(blogpost);
        const displayModal = this.state.displayModal;
        if (this.state.loading) {
            return (
                <div>
                    <h1>Loading...</h1>
                </div>
            )
        }
        if (blogpost == null) {
            return (
                <div>
                    <h1>Blog not found :(</h1>
                </div>
            );
        }
        const sections = [];
        blogpost.body.forEach((section) => {
            sections.push(section.sectionTitle);
        });
        return (
            <div className="blogpost-container">
                <div className={"mobile-only blogpost-header-container card"}>
                    <div className="blogpost-header min">
                        <h3>{blogpost.title}</h3>
                        <div className="btn" onClick={() => { this.setState({ displayModal: !displayModal }) }}><h3>Overview</h3></div>
                    </div>
                    <ul className={"expandable " + (displayModal ? "exp" : "min")}>
                        {
                            sections.map((sectionTitle) => {
                                return (
                                    <li class="dropdown-item">
                                        <a href={"#" + titleToId(sectionTitle)}>{sectionTitle}</a>
                                    </li>
                                );
                            })
                        }
                    </ul>
                </div>
                <div className="blog-body">
                    <div class="desktop-only">
                        <h2>{blogpost.title}</h2>
                        <hr/>
                    </div>
                    {
                        blogpost.body.map((section) => {
                            let str = "";
                            section.sectionContent.forEach((content) => { str += content });
                            return (
                                <div id={titleToId(section.sectionTitle)} dangerouslySetInnerHTML={{ __html: str }}>
                                </div>);
                        })
                    }
                </div>
                <div className="desktop-only">
                    <div className="card-light">
                        <h3>About</h3>
                        <p>{blogpost.about}</p>
                    </div>
                    <div className="card overview-card">
                        <h3>Overview</h3>
                        <ul>
                            {
                                sections.map((sectionTitle) => {
                                    return (
                                        <li class="dropdown-item">
                                            <a href={"#" + titleToId(sectionTitle)}>{sectionTitle}</a>
                                        </li>
                                    );
                                })
                            }
                        </ul></div>
                </div>
            </div>
        )
    }
}

const domContainer = document.querySelector('#react-blogpost');
const root = ReactDOM.createRoot(domContainer);
root.render(e(BlogPost));