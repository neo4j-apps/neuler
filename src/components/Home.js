import {Button, Card, CardGroup, Container, Header, Icon} from "semantic-ui-react"
import React, {Component} from 'react'

import { selectGroup } from "../ducks/algorithms"
import {connect} from "react-redux";

class Home extends Component {


    render() {
        const containerStyle = {
            "marginLeft": "10px"
        }

        const {selectGroup} = this.props

        return (<div style={containerStyle}>
                <Container fluid>
                    <Header as={"h3"}>
                        Algorithm Categories
                    </Header>
                    <p>
                        The Neo4j Graph Algorithms Library supports the following categories of algorithms.
                    </p>

                    <CardGroup>
                        <Card key={"centralities"}>
                            <Card.Content>
                                <Icon name='sitemap'/>
                                <Card.Header>
                                    Centralities
                                </Card.Header>
                                <Card.Meta>
                                    centrality algorithms determine the importance of distinct nodes in a network
                                </Card.Meta>
                            </Card.Content>
                            <Card.Content extra>
                                <div className='ui two buttons'>
                                    <Button basic color='green' onClick={() => selectGroup('Centralities')}>
                                        Select
                                    </Button>
                                </div>
                            </Card.Content>
                        </Card>

                        <Card key={"communityDetection"}>
                            <Card.Content>
                                <Icon name='sitemap'/>
                                <Card.Header>
                                    Community Detection
                                </Card.Header>
                                <Card.Meta>
                                    community detection algorithms evaluate how a group is clustered or partitioned, as
                                    well as its tendency to strengthen or break apart
                                </Card.Meta>
                            </Card.Content>
                            <Card.Content extra>
                                <div className='ui two buttons'>
                                    <Button basic color='green' onClick={() => selectGroup('Community Detection')}>
                                        Select
                                    </Button>
                                </div>
                            </Card.Content>
                        </Card>

                    </CardGroup>

                </Container>
            </div>
        )

    }
}

const mapStateToProps = state => ({
    activeGroup: state.algorithms.group
})

const mapDispatchToProps = dispatch => ({
    selectGroup: group => dispatch(selectGroup(group))
})

export default connect(mapStateToProps, mapDispatchToProps)(Home)
