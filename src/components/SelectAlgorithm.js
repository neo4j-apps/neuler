import React from "react";
import {algorithmGroups, getAlgorithmDefinitions, getAlgorithms, getGroup} from "./algorithmsLibrary";
import {OpenCloseSection} from "./Form/OpenCloseSection";
import {Card, Header, Icon} from "semantic-ui-react";
import {connect} from "react-redux";
import {selectAlgorithm, selectGroup} from "../ducks/algorithms";
import ScrollMenu from "react-horizontal-scrolling-menu";

const SelectAlgorithmView = ({currentAlgorithm, metadata, selectAlgorithm, selectGroup}) => {
    const [selectedAlgorithm, setSelectedAlgorithm] = React.useState(null)
    const [selectingAlgorithm, setSelectingAlgorithm] = React.useState(false)
    const algoGroupsForVersion = algorithmGroups(metadata.versions.gdsVersion);

    React.useEffect(() => {
        setSelectedAlgorithm(currentAlgorithm)
    }, [])

    const handleChange = ({value}) => {
        const group = getGroup(value, metadata.versions.gdsVersion);
        selectGroup(group, metadata.versions.gdsVersion)
        selectAlgorithm(value)
        setSelectedAlgorithm(value)
    }

    const allAlgorithms = {}
    Object.keys(algoGroupsForVersion).forEach(group => {
        getAlgorithms(group, metadata.versions.gdsVersion).forEach(algorithm => {
            allAlgorithms[algorithm] = {
                description: getAlgorithmDefinitions(group, algorithm, metadata.versions.gdsVersion).description,
                group: group
            }
        })
    })

    const Arrow = ({ text, className }) => {
        return <div className={className}>{text}</div>;
    };
    const ArrowLeft = <Icon className="arrow alternate circle left grey arrow-prev" />
    const ArrowRight = <Icon className="arrow alternate circle right grey arrow-next" />

    return (selectedAlgorithm &&
        <OpenCloseSection title="Algorithm">
            <div style={{border: "1px solid rgba(34,36,38,.15)", borderRadius: ".28571429rem", padding: "10px"}}>
                <div style={{display: "flex", cursor: "pointer" ,justifyContent: "space-between"}} onClick={() => setSelectingAlgorithm(!selectingAlgorithm)}>
                <Header as="h3">
                    {selectedAlgorithm}
                    <Header.Subheader>
                        {allAlgorithms[selectedAlgorithm].description}
                    </Header.Subheader>
                </Header>
                <Icon name={selectingAlgorithm ? 'triangle up' : 'triangle down'} size="big"/>
                </div>

                <div style={selectingAlgorithm ? {display: ''} : {display: 'none'}} className="algorithm-groups">
                    {Object.keys(algoGroupsForVersion).map(group => <div key={group} className="algorithm-group-container">
                        <div className="algorithm-group">
                            <span>{group}</span>
                        </div>

                            <ScrollMenu data={getAlgorithms(group, metadata.versions.gdsVersion).map(algorithm => {
                                return <div key={"card-" + algorithm}
                                             className={selectedAlgorithm === algorithm ? "select-algorithm selected" : "select-algorithm"}
                                             onClick={() => {
                                                 handleChange({value: algorithm})
                                             }}
                                >
                                    {algorithm}
                                </div>
                            })}
                                        transition={0.4}
                                        arrowLeft={ArrowLeft}
                                        arrowRight={ArrowRight}
                                        scrollBy={0}
                                        hideArrows={true}
                                        translate={0}
                            />

                    </div>)
                    }
                </div>
            </div>
        </OpenCloseSection>)
}
export default connect(state => ({
    metadata: state.metadata,
}), dispatch => ({
    selectAlgorithm: algorithm => dispatch(selectAlgorithm(algorithm)),
    selectGroup: (algorithm, gdsVersion) => dispatch(selectGroup(algorithm, gdsVersion)),
}))(SelectAlgorithmView)
