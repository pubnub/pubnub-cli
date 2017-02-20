import * as fs from "fs";
import * as path from "path";
import {maybe, Maybe} from "@grayfox/tsmonad";

export function validateBlockDirectory(blockPath: string): string {
    console.log(`Validating path: ${blockPath}`);
    if(!fs.existsSync(blockPath) || !fs.lstatSync(blockPath).isDirectory()){
        throw(new Error("Specified path is not a valid directory"))
    } else if (!fs.existsSync(path.join(blockPath, "block.json"))) {
        throw(new Error(`Cannot find block.json in ${blockPath}`))
    } else {
        return blockPath
    }
}

class FilesComponent {
    public readJsonFile<T>(filePath: string): Maybe<T> {
        console.log(`Reading file ${filePath}`);
        if (fs.existsSync(filePath)) {
            try {
                let contents = JSON.parse(fs.readFileSync(filePath)) as T;
                return Maybe.just<T>(contents);
            } catch(err) {
                return Maybe.nothing<T>();
            }
        } else {
            console.log(`${filePath} doesn't exist!`);
            return Maybe.nothing<T>();
        }
    }

    public writeJsonToFile(filePath: string, json: any):Object {
        let parsed = path.parse(filePath);

        parsed.dir.split(path.sep).reduce((pathAcc, segment) => {
            let newPath = path.join(pathAcc, segment);
            if(!fs.existsSync(newPath)) { fs.mkdirSync(newPath); }
            return newPath;
        }, parsed.root);

        console.log("Saving file at", filePath);
        console.log("Saving", json);
        fs.writeFileSync(filePath, JSON.stringify(json));

        return json
    }
}

const filesComponent = new FilesComponent();
export default filesComponent;