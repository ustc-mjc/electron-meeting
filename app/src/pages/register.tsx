import { useAppDispatch as useDispatch } from "../app/hooks";
import React, {ChangeEvent, useState, FormEvent} from "react";
import { useHistory } from "react-router-dom";
import { show } from "../slices/toast";
import { register } from "../slices/meeting";

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    const dispatch = useDispatch();
    const history = useHistory();

    // useEffect(() => {
    //     if (meeting.status === MeetingStatus.IN_MEETING) {
    //         history.replace(`/meeting/${meeting.id}`);
    //     }
    // });

    const onUserNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setUsername(event.currentTarget.value);
    }

    const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPassword(event.currentTarget.value);
    }

    const onConfirmPassChange = (event: ChangeEvent<HTMLInputElement>) => {
        setConfirmPass(event.currentTarget.value);
    }
    
    const signUp = (event: FormEvent<HTMLInputElement>) => {
        event.preventDefault();
        if (username === '' || password === '' || confirmPass === '') {
            dispatch(show('username or password null!'));
            return;
        }
        const regex = /^[\u4E00-\u9FA5A-Za-z][\u4E00-\u9FA5A-Za-z0-9]+$/;
        if (!regex.test(username)) {
            dispatch(show('username error, please input again!'))
            return;
        }
        if (password !== confirmPass) {
            dispatch(show('different password!'))
            return;
        }
        dispatch(register({username: username, password: password}));
        history.replace(`/`);
    }
    const returnToLogin = () => {
        history.replace(`/`);
    }

    return (
        <div className="grid min-h-screen place-items-center">
            <div className="w-11/12 p-12 bg-white sm:w-8/12 md:w-1/2 lg:w-5/12">
                <h1 className="text-xl font-semibold">Hello there 👋, <span className="font-normal">please fill in your information to continue</span></h1>
                <form className="mt-6">
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Username</label>
                    <input onChange={onUserNameChange} id="username" type="text" name="username" placeholder="Must start with a letter and does not contain special characters" autoComplete="username" className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner" required />
                    {/* <label className="block mt-2 text-xs font-semibold text-gray-600 uppercase">E-mail</label>
                    <input id="email" type="email" name="email" placeholder="john.doe@company.com" autoComplete="email" className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner" required /> */}
                    <label className="block mt-2 text-xs font-semibold text-gray-600 uppercase">Password</label>
                    <input onChange={onPasswordChange} id="password" type="password" name="password" placeholder="********" autoComplete="new-password" className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner" required />
                    <label className="block mt-2 text-xs font-semibold text-gray-600 uppercase">Confirm password</label>
                    <input onChange={onConfirmPassChange} id="password-confirm" type="password" name="password-confirm" placeholder="********" autoComplete="new-password" className="block w-full p-3 mt-2 text-gray-700 bg-gray-200 appearance-none focus:outline-none focus:bg-gray-300 focus:shadow-inner" required />
                    <button onClick={(event: any) => signUp(event)} type="submit" className="w-full py-3 mt-6 font-medium tracking-widest text-white uppercase bg-green-500 shadow-lg focus:outline-none hover:bg-blue-300 hover:shadow-none">
                        Sign up
                    </button>
                    <button onClick={returnToLogin} className="justify-between inline-block mt-4 text-xs text-gray-500 cursor-pointer hover:text-black">Already registered?</button>
                </form>
            </div>
        </div>
    )
}
export default Register;