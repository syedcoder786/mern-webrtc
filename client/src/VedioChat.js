import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client'
import Peer from 'simple-peer'

function VedioChat(props) {
    const [yourId, setUserId] = useState('')
    const [users, setUsers] = useState({})
    const [stream, setStream] = useState()
    const [recievingCall, setRecievingCall] = useState(false)
    const [caller, setCaller] = useState('')
    const [callerSignal, setCallerSignal] = useState()
    const [callAccepted, setCallAccepted] = useState(false)

    const userVedio = useRef()
    const partnerVedio = useRef()
    const socket = useRef()
    const peerRef = useRef();

    useEffect(() => {
        socket.current = io.connect("/")
        navigator.mediaDevices.getUserMedia({ video:true, audio:true }).then(stream => {
            setStream(stream)
            console.log(stream)
            console.log(userVedio.current)
            if(userVedio.current){
                userVedio.current.srcObject = stream;
            }
        })

        socket.current.on("yourId", (id) => {
            setUserId(id)
        })

        socket.current.on("allUsers", (users) => {
            setUsers(users)
        })

        socket.current.on("hey", (data) => {
            setRecievingCall(true)
            setCaller(data.from)
            setCallerSignal(data.signal)
        })

        socket.current.on("userDisconnected", (socketId) => {
            // console.log("delting:"+socketId)
            peerRef.current.destroy()
            setUsers((prevData) => {
                const newData = {...prevData}
                delete newData[socketId]
                return newData;
              })
            setRecievingCall(false)
            setCaller('')
            setCallAccepted(false)
        })

    },[])

    // useEffect(() => {
    //     socket.current.on("userDisconnected", (socketId) => {
    //         // leaveCall()
    //         if(caller === socketId){
    //             console.log("removing data")
    //             setRecievingCall(false)
    //             setCaller('')
    //             // setCallerSignal()
    //             setCallAccepted(false)
    //         }
    //     })
    // },[caller])

    const callPeer = (id) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
        })

        peer.on("signal", data => {
            console.log(data)
            socket.current.emit("callUser", { userToCall:id, signalData:data, from:yourId })
            setCaller(id)
        })

        //On Responce from another peer
        peer.on("stream", stream => {
            // console.log(stream)
            if(partnerVedio.current){
                partnerVedio.current.srcObject = stream
            }
        })

        socket.current.on("callAccepted", signal => {
            console.log("call accepted")
            console.log(signal)
            setCallAccepted(true)
            // console.log(signal)
            peer.signal(signal)
        })

        peerRef.current = peer;
        // socket.current.on("userDisconnected", (socketId) => {
        //     console.log("disconnected")
        //     console.log(caller)
        //     if(caller === socketId){
        //         setRecievingCall(false)
        //         setCaller('')
        //         setCallerSignal()
        //         setCallAccepted(false)
        //     }
        // })
    }

    // const leaveCall = () => {
    //     // setCallEnded(true);
    //     connectionRef.current.destroy();
    // }

    function acceptCall() {
        setCallAccepted(true)
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream,
        })

        peer.on("signal", data => {
            socket.current.emit("acceptCall", { signal:data, to:caller })
        })

        peer.on("stream", stream => {
            // console.log(stream)
            partnerVedio.current.srcObject = stream
        })

        peerRef.current = peer;

        peer.signal(callerSignal)

        // socket.current.on("userDisconnected", (socketId) => {
        //     // leaveCall()
        //     if(caller === socketId){
        //         setRecievingCall(false)
        //         setCaller('')
        //         setCallerSignal()
        //         setCallAccepted(false)
        //     }
        // })
    }

    let UserVedio;

    if(stream){
        UserVedio = (
            <video playInline muted ref={userVedio} autoPlay/>
        );
    }

    let PartnerVedio;

    if(callAccepted){
        PartnerVedio = (
            <video playInline ref={partnerVedio} autoPlay/>
        );
    }

    let incomingCall;
    if(recievingCall && !callAccepted){
        incomingCall = (
            <div>
                <h1>{caller} is calling you.</h1>
                <button onClick={acceptCall}>Accept</button>
            </div>
        )
    }


    const newUsers = Object.keys(users).map(key => {
        if(key === yourId){
            return null;
        }
        else if(!callAccepted){
            return (
                <div><button onClick={() => callPeer(key)}>Call {key}</button><br/></div>
            )
        }
    })

    return (
        <div>
            {UserVedio}
            {PartnerVedio}
            <br/>
            {newUsers}
            {incomingCall}
        </div>
    );
}

export default VedioChat;