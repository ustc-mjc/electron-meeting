import { RootState } from "../app/store";
import { useAppDispatch as useDispatch } from "../app/hooks";
import React, {ChangeEvent, useEffect, useState, FormEvent} from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { requestLogin } from "../slices/meeting";
import { show } from "../slices/toast";

const getMeeting = (state: RootState) => state.meeting;
const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const dispatch = useDispatch();
    const meeting = useSelector(getMeeting);
    const history = useHistory();

    useEffect(() => {
        if (meeting.loginInfo.loginState) {
            history.replace(`/new_meeting`);
            dispatch(show('login success!'))
        }
    });

    const onUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setUsername(event.currentTarget.value);
    }

    const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPassword(event.currentTarget.value);
    }
    const signIn = (event: FormEvent<HTMLInputElement>) => {
        event.preventDefault();
        if (username === '' || password === '') {
            dispatch(show('username or password null!'));
            return;
        }
        dispatch(requestLogin({
            username: username,
            password: password
        }));
        if (!meeting.loginInfo.loginState) {
            dispatch(show('login failed! please check your username or password!'));
        }
    }

    const register = () => {
        history.replace(`/register`)
    }

    return (
        <div className="p-8 font-mono">
            <div className="bg-gray-100 w-full lg:w-1/3 mx-auto rounded-lg lg:my-20 px-4 py-4 shadow-lg">
                <div className="flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="64px" viewBox="0 0 24 24" width="128px" fill="#54b72b"><rect fill="none" height="64" width="128"/><g><path d="M12,12.75c1.63,0,3.07,0.39,4.24,0.9c1.08,0.48,1.76,1.56,1.76,2.73L18,17c0,0.55-0.45,1-1,1H7c-0.55,0-1-0.45-1-1l0-0.61 c0-1.18,0.68-2.26,1.76-2.73C8.93,13.14,10.37,12.75,12,12.75z M4,13c1.1,0,2-0.9,2-2c0-1.1-0.9-2-2-2s-2,0.9-2,2 C2,12.1,2.9,13,4,13z M5.13,14.1C4.76,14.04,4.39,14,4,14c-0.99,0-1.93,0.21-2.78,0.58C0.48,14.9,0,15.62,0,16.43L0,17 c0,0.55,0.45,1,1,1l3.5,0v-1.61C4.5,15.56,4.73,14.78,5.13,14.1z M20,13c1.1,0,2-0.9,2-2c0-1.1-0.9-2-2-2s-2,0.9-2,2 C18,12.1,18.9,13,20,13z M24,16.43c0-0.81-0.48-1.53-1.22-1.85C21.93,14.21,20.99,14,20,14c-0.39,0-0.76,0.04-1.13,0.1 c0.4,0.68,0.63,1.46,0.63,2.29V18l3.5,0c0.55,0,1-0.45,1-1L24,16.43z M12,6c1.66,0,3,1.34,3,3c0,1.66-1.34,3-3,3s-3-1.34-3-3 C9,7.34,10.34,6,12,6z"/></g></svg>
                </div>
                <div className="flex justify-center bottom text-green-600">
                    Meeting
                </div>
                <form>
                    <input type='text' placeholder="Username" autoComplete="username" required onChange={onUsernameChange}
                        className="w-full mb-3 px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:border-green-500" />
                    <input type='password' placeholder="Password" autoComplete="current-password" required onChange={onPasswordChange}
                        className="w-full mb-3 px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:border-green-500" />
                    <button type="submit" className="bg-blue-600 text-white py-3 rounded-lg w-full font-bold text-xl tracking-wider" onClick={(event:any)=> signIn(event)}>
                        Sign In
                    </button>
                </form>
                {/* <div className="flex justify-center my-4">
                    <a className="text-blue-500 text-sm" href="##">Forgot account?</a>
                </div> */}
                <hr className=""/>
                <div className="flex justify-center my-6">
                    <button className="bg-green-500 text-white h-12 rounded px-6 font-bold" onClick={register}>Create new Account </button>
                </div>
            </div>
        </div>
    )
}
export default Login;