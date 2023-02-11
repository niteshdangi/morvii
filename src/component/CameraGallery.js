import * as React from "react";
import {
  StyleSheet,
  View,
  Button,
  Platform,
  PermissionsAndroid,
  Dimensions,
  TouchableOpacity,
  Text,
  Image,
} from "react-native";
import MorviiCamera from "./utils/MorviiCamera";
import * as Constants from "./Constants";
const effectsData = [
  {
    name: "me",
    title: "Me",
  },
  {
    name: "aviators",
    title: "Aviators",
  },
  {
    name: "ball_face",
    title: "Ball face",
  },
  {
    name: "beard",
    title: "Beard",
  },
  {
    name: "beauty",
    title: "Beauty",
  },
  {
    name: "fairy_lights",
    title: "Fairy lights",
  },
  {
    name: "background_segmentation",
    title: "Background segmentation",
  },
  {
    name: "hair_segmentation",
    title: "Hair segmentation",
  },
  {
    name: "flower_crown",
    title: "Flower crown",
  },
  {
    name: "frankenstein",
    title: "Frankenstein",
  },
  {
    name: "lion",
    title: "Lion",
  },
  {
    name: "manly_face",
    title: "Manly face",
  },
  {
    name: "plastic_ocean",
    title: "Plastic ocean",
  },
  {
    name: "pumpkin",
    title: "Pumpkin",
  },
  {
    name: "scuba",
    title: "Scuba diver",
  },
  {
    name: "tape_face",
    title: "Tape face",
  },
  {
    name: "tiny_sunglasses",
    title: "Tiny sunglasses",
  },
  {
    name: "topology",
    title: "Topology",
  },
];
class CameraGallery extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      permissionsGranted: Platform.OS === "ios",
      currentEffectIndex: 0,
      switchCameraInProgress: false,
    };
  }

  componentDidMount() {
    if (Platform.OS === "android") {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]).then((result) => {
        if (
          result["android.permission.CAMERA"] === "granted" &&
          result["android.permission.WRITE_EXTERNAL_STORAGE"] === "granted" &&
          result["android.permission.RECORD_AUDIO"] === "granted"
        ) {
          this.setState({ permissionsGranted: true, showPermsAlert: false });
        } else {
          this.setState({ permissionsGranted: false, showPermsAlert: true });
        }
      });
    }
    if (this.deepARView) {
      this.deepARView.resume();
    }
    this.props.navigation.addListener("focus", () => {
      if (this.deepARView) {
        this.deepARView.resume();
      } else {
        console.log("404");
      }
    });
    this.props.navigation.addListener("blur", () => {
      if (this.deepARView) {
        this.deepARView.pause();
      } else {
        console.log("403");
      }
    });
  }

  componentWillUnmount() {
    if (this.deepARView) {
      this.deepARView.pause();
    }
  }

  onEventSent = (event) => {
    if (event.type === "cameraSwitch") {
      this.setState({ switchCameraInProgress: false });
    } else if (event.type === "initialized") {
    } else if (event.type === "didStartVideoRecording") {
    } else if (event.type === "didFinishVideoRecording") {
    } else if (event.type === "recordingFailedWithError") {
    } else if (event.type === "screenshotTaken") {
      this.screenshotTaken(event.value);
    } else if (event.type === "didSwitchEffect") {
    } else if (event.type === "imageVisibilityChanged") {
    }
  };

  onChangeEffect = (direction) => {
    if (!this.deepARView) {
      return;
    }

    const { currentEffectIndex } = this.state;
    var newIndex =
      direction > 0 ? currentEffectIndex + 1 : currentEffectIndex - 1;
    if (newIndex >= effectsData.length) {
      newIndex = 0;
    }
    if (newIndex < 0) {
      newIndex = effectsData.length - 1;
    }

    const newEffect = effectsData[newIndex];
    this.deepARView.switchEffect(
      Constants.LENSES_URL + newEffect.name,
      "effect"
    );

    this.setState({ currentEffectIndex: newIndex });
  };

  takeScreenshot = () => {
    if (this.deepARView) {
      this.deepARView.takeScreenshot();
    }
  };

  screenshotTaken = (screenshotPath) => {
    const path = "file://" + screenshotPath;
    // const transition = slideTransitionDefinition({
    //   isVertical: true,
    //   direction: 1,
    //   duration: 200,
    // });
    // this.props.push("preview", transition, { screenshotPath: path });
  };

  switchCamera = () => {
    const { switchCameraInProgress } = this.state;
    if (!switchCameraInProgress && this.deepARView) {
      this.setState({ switchCameraInProgress: true });
      this.deepARView.switchCamera();
    }
  };

  render() {
    const { permissionsGranted, currentEffectIndex } = this.state;
    const { width } = Dimensions.get("window");

    const effect = effectsData[currentEffectIndex];
    const screenshotImg = require("../../assets/avia.png");
    const cameraSwitchImg = require("../../assets/icon.png");

    return (
      <View style={styles.container}>
        {permissionsGranted ? (
          <MorviiCamera
            onEventSent={this.onEventSent}
            ref={(ref) => {
              this.deepARView = ref;
              ref?.pause();
              ref?.resume();
              // console.log(ref?.resume);
            }}
            style={{ width: width, height: "100%" }}
          />
        ) : null}

        <TouchableOpacity
          style={styles.cameraSwitchContainer}
          onPress={() => this.switchCamera()}>
          <Image style={styles.camera} source={cameraSwitchImg} />
        </TouchableOpacity>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={{ flex: 1, alignItems: "center" }}
            onPress={() => this.onChangeEffect(-1)}>
            <View style={styles.prevContainer}>
              <Text style={styles.prev}>Previous</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1, alignItems: "center" }}
            onPress={() => this.takeScreenshot()}>
            <View style={styles.screenshotContainer}>
              <Image style={styles.screenshot} source={screenshotImg} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1, alignItems: "center" }}
            onPress={() => this.onChangeEffect(1)}>
            <View style={styles.nextContainer}>
              <Text style={styles.next}>Next</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  deepARView: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  titleContainer: {
    position: "absolute",
    top: 100,
    width: "50%",
    backgroundColor: "white",
    borderRadius: 4,
    backgroundColor: "white",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
  },

  bottomBtnContainer: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    bottom: 100,
    height: 50,
  },
  nextContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    backgroundColor: "white",
  },
  prevContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    backgroundColor: "white",
  },
  next: {
    textAlign: "center",
    fontSize: 28,
  },
  prev: {
    textAlign: "center",
    fontSize: 28,
  },

  screenshotContainer: {},
  screenshot: {
    width: 70,
    height: 70,
  },

  cameraSwitchContainer: {
    position: "absolute",
    width: 50,
    height: 40,
    right: 20,
    top: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
});

export default CameraGallery;
