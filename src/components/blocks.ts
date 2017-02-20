import Files from "./files"

type BlockJson = Object;

class BlocksComponent {
    private _blockFile = "block.json";

    public readBlockFile(dirPath: string, name: string = this._blockFile):BlockJson {
        return Files.readJsonFile(dirPath + name)
    }
}

const blocksComponent = new BlocksComponent();
export default blocksComponent;