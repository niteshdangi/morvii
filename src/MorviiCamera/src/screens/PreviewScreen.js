import * as React from 'react'
import { StyleSheet, View, Button, Image, Animated, Easing, TouchableOpacity, Text } from 'react-native'
import CameraRoll from "@react-native-community/cameraroll";

class PreviewScreen extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      currentAssetPath: null,
      showAlert: false,
      alertAnimation: new Animated.Value(0)
    }
  }

  goBack = () => {
    // Go back to main screen
    this.props.pop()
  }

  onSaveToCameraRollPress = () => {
    const path = this.props.screenshotPath
    const type = 'photo'

    CameraRoll.saveToCameraRoll(path, type).then(res => {
      this.setState({currentAssetPath: res});
      this.setState({showAlert: true});

      Animated.timing(this.state.alertAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      }).start(() => {
        Animated.timing(this.state.alertAnimation, {
          toValue: 0,
          duration: 100,
          delay: 2000,
          useNativeDriver: true
        }).start(() => {
          this.setState({showAlert: false});
        });
      });
    });
  }

  dismissAlert = () => {
    Animated.timing(this.state.alertAnimation, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true
    }).start(() => {
      this.setState({showAlert: false});
    });
  }

  render() {

    const { showAlert } = this.state

    return (
      <View style={styles.container}>
        <Image style={styles.image} source={{ uri: this.props.screenshotPath }} />


        <TouchableOpacity style={styles.bottomBtnContainer} onPress={ () => this.onSaveToCameraRollPress()}>
          <Text style={styles.saveToGallery}>Save to Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtnContainer} onPress={ () => this.goBack()}>
          <Text style={styles.saveToGallery}>Back</Text>
        </TouchableOpacity>

         {
          showAlert &&
          <Animated.View style={[styles.alertBg, { opacity: this.state.alertAnimation }]} >
            <View style={styles.alert} >
              <Text style={styles.alertText}>Photo saved to Gallery!</Text>
              <View style={styles.blackLineSeparator} ></View>
              <TouchableOpacity style={styles.alertBtn} onPress={this.dismissAlert}>
                <Text style={styles.alertBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        }
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bottomBtnContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
    bottom: 120,
    height: 50,
    borderRadius:4
  },
  backBtnContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
    bottom: 60,
    height: 50,
    borderRadius:4
  },
  saveToGallery: {
    textAlign:'center',
    fontSize: 28,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius:4,
    backgroundColor: 'white'
  },
  image: {
    position: 'absolute',
    flex: 1,
    width: '100%',
    height: '100%'
  },
  alertBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  alert: {
    backgroundColor: 'rgba(169,216,233,1)',
    borderColor: '#000',
    borderWidth: 2,
    width: 240
  },
  alertText: {
    padding: 20,
    color: '#000',
    fontSize: 22,
    backgroundColor: '#fff',
  },
  alertBtn: {
    padding: 10,
  },
  alertBtnText: {
    color: '#000',
    fontSize: 22,
    textAlign: 'center'
  },
  blackLineSeparator: {
    width: '100%',
    height: 2,
    backgroundColor: '#000'
  }
})

export default PreviewScreen;