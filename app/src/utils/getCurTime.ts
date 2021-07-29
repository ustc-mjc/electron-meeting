const getCurTime : () => string = () => {
    let current_datetime = new Date();
    const formatTime = current_datetime.getFullYear() + "-" + 
                            (current_datetime.getMonth() + 1) + "-" +   
                            current_datetime.getDate() + " " + 
                            current_datetime.getHours() + ":" + 
                            current_datetime.getMinutes() + ":" + 
                            current_datetime.getSeconds();
    return formatTime;
};

export { getCurTime };
