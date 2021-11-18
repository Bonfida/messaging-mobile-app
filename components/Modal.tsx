import { Modal as ModalNative, Platform } from "react-native";
import ModalWeb from "modal-react-native-web";

const Modal = Platform.OS === "web" ? ModalWeb : ModalNative;

export default Modal;
