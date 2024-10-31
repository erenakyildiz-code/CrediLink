export default async function addHiring(reqBody) {
    console.log(reqBody);
    //localhost:3000/getHiringDocs
    var headers = {
    method: "POST",
    headers: {
      "accept": "application/json",
      "Content-Type": "application/json", // Make sure to send JSON data
    },
    body: JSON.stringify(reqBody)
};

    var res = await fetch(process.env.API_URL + "/newHiringDoc",headers);
    res = await res.json();
    return res;

}