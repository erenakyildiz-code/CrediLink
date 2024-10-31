export default async function getConnections() {
    //localhost:3000/connections
    var headers = {
    method: "GET",
    headers: {
      "accept": "application/json",
      "Content-Type": "application/json", // Make sure to send JSON data
    },
};

    var res = await fetch(process.env.API_URL + "/connections",headers);
    res = await res.json();
    return res;

}