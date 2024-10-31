export default async function getHiring() {
    //localhost:3000/getHiringDocs
    var headers = {
    method: "GET",
    headers: {
      "accept": "application/json",
      "Content-Type": "application/json", // Make sure to send JSON data
    },
};

    var res = await fetch(process.env.API_URL + "/getHiringDocs",headers);
    res = await res.json();
    return res;

}