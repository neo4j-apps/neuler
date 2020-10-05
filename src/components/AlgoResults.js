import React, {useEffect, useState} from 'react'
import {Header, Message, Segment, Button} from 'semantic-ui-react'
import {connect} from "react-redux"
import {getAlgorithmDefinitions} from "./algorithmsLibrary"
import CodeView, {constructQueries} from './CodeView'

import {ADDED, addTask, completeTask, FAILED, removeTask, runTask} from "../ducks/tasks"
import {sendMetrics} from "./metrics/sendMetrics";
import {FailedTopBar} from "./Results/FailedTopBar";
import {SuccessTopBar} from "./Results/SuccessTopBar";
import {TableView} from "./Results/TableView";
import {VisView} from "./Results/VisView";
import {ChartView} from "./Results/ChartView";
import AlgorithmForm from "./AlgorithmForm";
import {v4 as generateTaskId} from "uuid";
import {getCurrentAlgorithm} from "../ducks/algorithms";
import {getActiveDatabase} from "../services/stores/neoStore";
import NewAlgorithmModal from "./NewAlgorithmModal";

export const tabContentStyle = {
  height: '85vh',
  overflowY: 'auto',
  overflowX: 'hidden'
}

const HorizontalAlgoTab = (props) => {
  const { task, currentPage, totalPages } = props

  const panelRef = React.createRef()
  const [activeItem, setActiveItem] = React.useState("Configure")

  const handleMenuItemClick = (e, { name }) => {
    sendMetrics('neuler-click-view', name)
    setActiveItem(name)
  }

  React.useEffect(() => {
    if (task.status === ADDED) {
      setActiveItem("Configure")
    } else {
      if (task.error) {
        setActiveItem("Error")
      } else {
        setActiveItem("Table")
      }
    }
  }, [task.status])

    const activeGroup = task.group
    const getStyle = name => name === activeItem ? {display: ''} : {display: 'none'}

    return (
      <div style={{padding: "10px"}}>
        {task.completed && task.status === FAILED ? (
                <React.Fragment>
                  <FailedTopBar task={task} activeItem={activeItem}  tasks={props.tasks}
                                currentPage={currentPage} totalPages={totalPages} handleMenuItemClick={handleMenuItemClick.bind(this)}
                                setSelectedTaskId={props.setSelectedTaskId}
                  />

                  <Segment attached='bottom'>
                    <div style={getStyle("Configure")}>
                      <AlgorithmForm
                          task={task}
                          limit={props.limit}
                          onRun={(newParameters, formParameters, persisted) => {
                            props.onRunAlgo(task, newParameters, formParameters, persisted)
                          }}
                          onCopy={(group, algorithm, newParameters, formParameters) => {
                            props.onCopyAlgo(group, algorithm, newParameters, formParameters)
                          }}
                      />
                    </div>
                    <div style={getStyle('Error')}>
                      <Message warning>
                        <Message.Header>Algorithm failed to complete</Message.Header>
                        <p>{task.error}</p>
                      </Message>
                    </div>
                    <div style={getStyle('Code')}>
                      <CodeView task={task}/>
                    </div>
                  </Segment>
                </React.Fragment>
          )
            : <React.Fragment>
                <SuccessTopBar task={task} activeItem={activeItem} activeGroup={activeGroup}
                               currentPage={currentPage} totalPages={totalPages} tasks={props.tasks}
                               panelRef={panelRef} handleMenuItemClick={handleMenuItemClick.bind(this)}
                               setSelectedTaskId={props.setSelectedTaskId}
                />
                <div ref={panelRef}>
                  <Segment attached='bottom'>
                    <div style={getStyle("Configure")}>
                      <AlgorithmForm
                          task={task}
                          limit={props.limit}
                          onRun={(newParameters, formParameters, persisted) => {
                            props.onRunAlgo(task, newParameters, formParameters, persisted)
                          }}
                          onCopy={(group, algorithm, newParameters, formParameters) => {
                            props.onCopyAlgo(group, algorithm, newParameters, formParameters)
                          }}
                      />
                    </div>


                    <div style={getStyle('Table')}>
                      <TableView task={task} gdsVersion={props.gdsVersion}/>
                    </div>

                    <div style={getStyle('Code')}>
                      <CodeView task={task}/>
                    </div>

                    {!(activeGroup === 'Path Finding' || activeGroup === 'Similarity') ?
                        <div style={getStyle('Visualisation')}>
                          <VisView task={task} active={activeItem === 'Visualisation'}/>
                        </div> : null}

                    {activeGroup === 'Centralities' ?
                        <div style={getStyle('Chart')}>
                          <ChartView task={task} active={activeItem === 'Chart'}/>
                        </div> : null}

                  </Segment>
                </div>
            </React.Fragment>
        }
      </div>
    )

}

const TabExampleVerticalTabular = (props) => {
  const [selectedTaskId, setSelectedTaskId] = useState(null)

  useEffect(() => {
    if(props.tasks.length > 0) {
      setSelectedTaskId(props.tasks[0].taskId)
    }
  }, [props.tasks.length === 0])

  const [newTask, setNewTask] = React.useState({})
  const constructNewTask = (activeGroup, activeAlgorithm) => {
    const taskId = generateTaskId()
    const addLimits = (params) => {
      return {
        ...params,
        limit: props.limit,
        communityNodeLimit: props.communityNodeLimit
      }
    }
    const {parameters} = getAlgorithmDefinitions(activeGroup, activeAlgorithm, props.metadata.versions.gdsVersion)
    const {parametersBuilder} = props.currentAlgorithm

    const params = parametersBuilder({
      ...parameters,
      requiredProperties: Object.keys(parameters)
    })

    const formParameters = addLimits(parameters);

    return {
      group: activeGroup,
      algorithm: activeAlgorithm,
      taskId,
      parameters: params,
      formParameters,
      persisted: parameters.persist,
      startTime: new Date(),
      database: getActiveDatabase(),
      status: ADDED
    }
  }

  const addNewTask = (group, algorithm, parameters, formParameters) => {
    setNewAlgorithmFormOpen(true)
    const taskId = generateTaskId()
    const task = {
      group, algorithm, taskId,
      parameters, formParameters, persisted: parameters.persist,
      startTime: new Date(),
      database: getActiveDatabase(),
      status: ADDED
    }

    setNewTask(task)

  }

  const onRunAlgo = (task, parameters, formParameters, persisted) => {
    setSelectedTaskId(null)
    const {taskId, group, algorithm} = task
    const algorithmDefinition = getAlgorithmDefinitions(group, algorithm, props.metadata.versions.gdsVersion);
    const {service, getFetchQuery} = algorithmDefinition

    let fetchCypher

    let streamQuery = algorithmDefinition.streamQuery
    let storeQuery = algorithmDefinition.storeQuery

    if (group === "Similarity") {
      const {itemLabel, relationshipType, categoryLabel, weightProperty} = parameters
      streamQuery = streamQuery(itemLabel, relationshipType, categoryLabel, weightProperty)
      storeQuery = storeQuery(itemLabel, relationshipType, categoryLabel, weightProperty)

      fetchCypher = getFetchQuery(itemLabel, parameters.config.writeRelationshipType, parameters.config)
      delete parameters.itemLabel
      delete parameters.relationshipType
      delete parameters.categoryLabel
    } else {
      fetchCypher = getFetchQuery(parameters.label, parameters.config)
    }

    const params = { ...props.metadata.versions, taskId, algorithm, group}
    sendMetrics('neuler-call-algorithm', algorithm, params)

    service({
      streamCypher: streamQuery,
      storeCypher: storeQuery,
      fetchCypher,
      parameters,
      persisted
    }).then(result => {
      sendMetrics('neuler', "completed-algorithm-call", params)
      props.completeTask(taskId, result)
      if (persisted) {
        props.onComplete()
      }
    }).catch(exc => {
      console.log('ERROR IN SERVICE', exc)
      props.completeTask(taskId, [], exc.toString())
    })

    const constructedQueries = constructQueries(algorithmDefinition, parameters, streamQuery)

    props.runTask(
        taskId,
        persisted ? [storeQuery, fetchCypher] : [streamQuery],
        persisted ?
            [constructedQueries.createGraph, constructedQueries.storeAlgorithmNamedGraph, fetchCypher, constructedQueries.dropGraph] :
            [constructedQueries.createGraph, constructedQueries.streamAlgorithmNamedGraph, constructedQueries.dropGraph],
        parameters,
        formParameters,
        persisted
    )
  }

  const tasks = props.tasks

  const [newAlgorithmFormOpen, setNewAlgorithmFormOpen] = React.useState(false)

  React.useEffect(() => {
    setNewTask(constructNewTask(props.activeGroup, props.activeAlgorithm))
  }, [props.activeGroup, props.activeAlgorithm])

  if (tasks && tasks.length > 0) {
    const currentTask = selectedTaskId ? tasks.find(task => task.taskId === selectedTaskId) : tasks[0]
    return <div>
      <Button onClick={() => {
        setNewAlgorithmFormOpen(true)
      }} primary>Configure an algorithm</Button>
      <HorizontalAlgoTab
        tasks={tasks}
        metadata={props.metadata}
        setSelectedTaskId={setSelectedTaskId}
        onRunAlgo={onRunAlgo}
        onCopyAlgo={addNewTask}
        task={currentTask}
        totalPages={tasks.length}
        gdsVersion={props.metadata.versions.gdsVersion}
    />
      <NewAlgorithmModal
          open={newAlgorithmFormOpen}
          setOpen={setNewAlgorithmFormOpen}
          onRunAlgo={onRunAlgo}
          task={newTask}
      />
    </div>
  } else {
    return <div>
      <Header>
        No algorithms run yet

        <Button onClick={() => {
          setNewAlgorithmFormOpen(true)
        }} primary>Configure an algorithm</Button>

      </Header>
      <NewAlgorithmModal
          open={newAlgorithmFormOpen}
          setOpen={setNewAlgorithmFormOpen}
          onRunAlgo={onRunAlgo}
          task={newTask}
      />
    </div>
  }
}

const mapStateToProps = state => ({
  tasks: state.tasks,
  limit: state.settings.limit,
  metadata: state.metadata,
  activeGroup: state.algorithms.group,
  activeAlgorithm: state.algorithms.algorithm,
  currentAlgorithm: getCurrentAlgorithm(state),
  communityNodeLimit: state.settings.communityNodeLimit,
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  runTask: (taskId, query, namedGraphQueries, parameters, formParameters, persisted) => {
    dispatch(runTask({ taskId, query, namedGraphQueries, parameters, formParameters, persisted }))
  },
  completeTask: (taskId, result, error) => {
    dispatch(completeTask({ taskId, result, error }))
  },
  onComplete: () => {
    ownProps.onComplete()
  },
  addTask: (taskId, group, algorithm, parameters, formParameters, persisted) => {
    const task = {
      group,
      algorithm,
      taskId,
      parameters,
      formParameters,
      persisted,
      startTime: new Date(),
      database: getActiveDatabase()
    }
    dispatch(addTask({ ...task }))
  },
  removeTask: (taskId) => {
    dispatch(removeTask({ taskId}))
  }
})


export default connect(mapStateToProps, mapDispatchToProps)(TabExampleVerticalTabular)
