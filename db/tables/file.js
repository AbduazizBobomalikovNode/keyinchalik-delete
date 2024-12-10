var searchError = require('../../resurs/functions/erors');

function File(table) {
    this.getFileObj = async(obj) => {
        const result = await table.find(obj, {
            projection: { _id: 0 ,lastModified:0}
        }).toArray();
        return result;
    }
    this.getFile = async(id) => {
        const result = await table.findOne({ id: id }, { projection: { _id: 0 ,lastModified:0} })
            .then(result => {
                return result;
            })
            .catch(err => {
                console.error(`Qurilma topilmadi: ${err}`)
                return false;
            })
        return result;
    }
    this.getFileCertificate = async (id) => {
        const result = await table.find({ idcertificate: id }, { projection: { _id: 0 ,lastModified:0} })
            .toArray()
        return result;
    }
    this.getFileAll = async() => {
        const result = await table.find({}, { projection: { _id: 0 ,lastModified:0} })
            .sort({ name: 1 }).toArray()
        return result;
    }
    this.addFile = async(file) => { 
        const result = await table
            .insertOne(file)
            .catch((err) => {
                let error = { error: [] };
                searchError(err, null, error);
                return error;
            });
        return result;
    }
    this.update = async(id, file) => {
        const result = await table
            .updateMany({ id: id }, {
                $set: file,
                $currentDate: { lastModified: true }
            }).catch(err => {
                let error = { error: [] };
                searchError(err, null, error);
                return error;
            });
        const devicex = await this.getFile(id);
        return devicex;
    }
    this.delete = async(id) => {
        const result = await table.deleteOne({ id: id })
        return result;
    }
}


module.exports = File;
/*
getFile()
getFileAll()
addFile()
update()
delete()
*/