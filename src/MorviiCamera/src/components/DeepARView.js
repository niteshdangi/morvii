// DeepArView.js
import PropTypes from 'prop-types';
import React from 'react';
import {
  UIManager,
  requireNativeComponent,
  findNodeHandle,
} from 'react-native';


var RNT_DEEPARVIEW_REF = 'deeparview';

class DeepARView extends React.Component {

  getDeepARViewHandle = () => {
    return findNodeHandle(this.refs[RNT_DEEPARVIEW_REF]);
  }

  switchCamera = () => {
    UIManager.dispatchViewManagerCommand(
      this.getDeepARViewHandle(),
      UIManager.getViewManagerConfig('RNTDeepARView').Commands.switchCamera,
      null
    );
  }

  switchEffect = (maskName, slot) => {
    UIManager.dispatchViewManagerCommand(
      this.getDeepARViewHandle(),
      UIManager.getViewManagerConfig('RNTDeepARView').Commands.switchEffect,
      [maskName, slot]
    );
  }

  setFlashOn = flashOn => {
    UIManager.dispatchViewManagerCommand(
      this.getDeepARViewHandle(),
      UIManager.getViewManagerConfig('RNTDeepARView').Commands.setFlashOn,
      [flashOn]
    );
  }

  pause() {
    UIManager.dispatchViewManagerCommand(
      this.getDeepARViewHandle(),
      UIManager.getViewManagerConfig('RNTDeepARView').Commands.pause,
      null
    );
  }

  resume() {
    UIManager.dispatchViewManagerCommand(
      this.getDeepARViewHandle(),
      UIManager.getViewManagerConfig('RNTDeepARView').Commands.resume,
      null
    );
  }

  takeScreenshot() {
    UIManager.dispatchViewManagerCommand(
      this.getDeepARViewHandle(),
      UIManager.getViewManagerConfig('RNTDeepARView').Commands.takeScreenshot,
      null
    );
  }

  startRecording() {
    UIManager.dispatchViewManagerCommand(
      this.getDeepARViewHandle(),
      UIManager.getViewManagerConfig('RNTDeepARView').Commands.startRecording,
      null
    );
  }

  finishRecording() {
    UIManager.dispatchViewManagerCommand(
      this.getDeepARViewHandle(),
      UIManager.getViewManagerConfig('RNTDeepARView').Commands.finishRecording,
      null
    );
  }


  render() {

    var onEventSent = (event) => {
      const onEventSentCallback = this.props.onEventSent;
      //console.log("RECEIVED message from native", event.nativeEvent, onEventSentCallback);

      if(onEventSentCallback) {
        onEventSentCallback(event.nativeEvent);
        //this.props.onEventSent(event.nativeEvent);
      }
    }

    let {...props} = {...this.props};
    delete props.onEventSent;

    return (
      <RNTDeepARView 
        ref={RNT_DEEPARVIEW_REF} 
        {...this.props} 
        onEventSent={onEventSent}/>
    )
  }
}

DeepARView.propTypes = {
  onEventSent: PropTypes.func,
};

var RNTDeepARView = requireNativeComponent('RNTDeepARView', DeepARView);

export default DeepARView
