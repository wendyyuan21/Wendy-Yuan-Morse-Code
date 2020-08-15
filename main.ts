let keystrokes = ""
//block user's input while in transmitting mode
let transmitting = false
let receiver_cn = ""

//Morse code look up table
let morseLUT = [".-", "-...", "-.-.", "-..", ".", "..-.",
            "--.", "....", "..", ".---", "-.-", ".-..",
            "--", "-.", "---", ".--.", "--.-", ".-.",
            "...", "-", "..-", "...-", ".--", "-..-",
            "-.--", "--..", ".----", "..---", "...--", "....-",
            ".....", "-....", "--...", "---..", "----.", "-----"]

//Alphabet table
let alphabet = ["A", "B", "C", "D", "E", "F",
                "G", "H", "I", "J", "K", "L",
                "M", "N", "O", "P", "Q", "R",
                "S", "T", "U", "V", "W", "X",
                "Y", "Z", "1", "2", "3", "4",
                "5", "6", "7", "8", "9", "0"]

//Set Bluetooth radio group
radio.setGroup(1)
radio.setTransmitSerialNumber(true);

input.onButtonPressed(Button.A, function () {
    if (!transmitting) {
        keystrokes = keystrokes + '.'
        basic.showString(keystrokes)
    }
})

input.onButtonPressed(Button.B, function () {
    if (!transmitting) {
        keystrokes = keystrokes + '-'
        basic.showString(keystrokes)
    }
})

input.onButtonPressed(Button.AB, function () {
    if (!transmitting) {
        if (Decoder(keystrokes) != "") {
            //Valid morse code, transmit it
            transmitting = true
        }
        else {
            //Invalid morse code
            basic.showString("Invalid!")
            keystrokes = ""
        }
    }
})

input.onGesture(Gesture.Shake, function() {
    basic.showString("clr")
    keystrokes = ""
    transmitting = false
    receiver_cn = ""
})

basic.forever(function () {
    Transmitter(keystrokes)
})

radio.onReceivedString(function (receivedString) {
    Receiver(receivedString)
})

function Transmitter(string_to_send: string) {
	if (transmitting) {
        radio.sendString(buildPackage(string_to_send));
        //Yeild 100 ms for confirmation
        basic.pause(100)
    }
}

function buildPackage(msg: string) {
    //Format : 
    //serialnumber+message
    //Challenge 2
    //Is there a way to make sure that only one person can be the receiver?
    //Answer: will keep the sn from the first received message
    //Only accept future messages from the same sn
    msg = control.deviceSerialNumber() + '+' + msg
    return msg
}

function Receiver (receivedString: string) {

    //Remove sn from the incoming string
    let sn_pos = receivedString.indexOf("+")
    if (sn_pos!=-1) {
        //found sender sn, keep it for later checking
        if (receiver_cn=="") {
            receiver_cn = receivedString.substr(0,sn_pos)
        } else {
            let incoming_sn = receivedString.substr(0,sn_pos)
            if (receiver_cn != incoming_sn) {
                //Challenge 2, reject messages that are not 
                //sent from the same sn of the first received
                //message
                return;
            }
        }

        receivedString = receivedString.substr(sn_pos+1)
        let isMorseCode = (receivedString.indexOf(".") != -1 ||
            receivedString.indexOf("-") != -1)

        if (transmitting) {
            if (!isMorseCode) {
                //Checking for echo
                let expected_string = Decoder(keystrokes)
                if (receivedString == expected_string) {
                    //Receiver has confirmed, back to input mode
                    transmitting = false
                    keystrokes = ""
                    basic.showIcon(IconNames.Yes)
                }
            } else {
                //Challenge 1
                //both parties sending information at the same time
                echoChar(receivedString)
            }
        }
        else {
        //Echo back while not in transmitting mode 
        echoChar(receivedString)
        }
    }
}

function echoChar(char: string) {
    //Echo back to sender with Ascii character
    let decoded_string = Decoder(char)
    radio.sendString(buildPackage(decoded_string))
    basic.showString(decoded_string)  
}

//Input: Morse
//Output: Ascii character from lookup table, "" if not valid
function Decoder(keystrokes: string) {
    let a = keystrokes.split("   ")
    let index = morseLUT.indexOf(keystrokes)
    if (index != -1) {
        return alphabet[index]
    } else {
        return "";
    }
}
