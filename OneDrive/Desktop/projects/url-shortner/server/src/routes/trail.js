const { resolve } = require("path");

function fetchUser(id){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if(id > 0) resolve({ id, name: "Nithin"});
            else reject(new Error("INvalid ID"));
        }, 600);
    });
}

fetchUser(1);