import axios from "axios";

export const fetchIpInfo = () => {
    return axios({
        method: "GET",
        url: 'https://ipapi.co/json',
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
    });
};