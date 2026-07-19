const fs = require("fs");
const path = require("path");


const FILE =
    path.join(
        __dirname,
        "../public/nexus_context.json"
    );


function carregar() {

    try {

        if (!fs.existsSync(FILE)) {

            return [];

        }


        return JSON.parse(
            fs.readFileSync(FILE,"utf8")
        );


    } catch {

        return [];

    }

}



function adicionar(usuario, nexus) {


    const memoria =
        carregar();


    memoria.push({

        usuario,

        nexus,

        data:
            Date.now()

    });



    while(memoria.length > 10) {

        memoria.shift();

    }



    fs.writeFileSync(
        FILE,
        JSON.stringify(
            memoria,
            null,
            2
        ),
        "utf8"
    );


}



module.exports = {

    carregar,

    adicionar

};
