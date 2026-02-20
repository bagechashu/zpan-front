import utils from '../utils'
import axios from './axios'

class zMatter {

    upload(sid, fileObj, distDir, cancel) {
        let file = fileObj.file
        let body = { sid: sid, name: fileObj.filename, type: file.type, size: file.size, dir: distDir };
        return new Promise((resolve, reject) => {
            axios.post('/matters', body).then(ret => {
                let data = ret.data
                utils.upload(fileObj, data.uploader.upURL, data.uploader.upHeaders, cancel).then(() => {
                    axios.patch(`/matters/${data.alias}/done`).then((ret) => {
                        resolve(ret.data)
                    })
                }).catch(reject)
            }).catch(reject)
        })
    }

    /**
     * Upload with pre-check for duplicate files
     * @param {number} sid - Storage ID
     * @param {object} fileObj - File object with .file and .filename
     * @param {string} distDir - Destination directory
     * @param {function} cancel - Cancel callback
     * @param {string} conflict - Conflict resolution: 'skip' | 'rename' | 'overwrite' | 'error'
     * @returns {Promise}
     */
    async uploadWithCheck(sid, fileObj, distDir, cancel, conflict = 'error') {
        const filename = fileObj.filename || fileObj.file.name
        
        try {
            // Pre-check if file exists
            const existing = await this.checkExistingFile(sid, distDir, filename)
            
            if (existing) {
                const message = `File "${filename}" already exists`
                if (conflict === 'error') {
                    throw new Error(message)
                } else if (conflict === 'skip') {
                    return { skipped: true, message }
                } else if (conflict === 'rename') {
                    // Auto-rename: append _1 to filename
                    const lastDotIndex = filename.lastIndexOf('.')
                    const newFilename = lastDotIndex === -1 
                        ? `${filename}_1` 
                        : `${filename.substring(0, lastDotIndex)}_1${filename.substring(lastDotIndex)}`
                    fileObj.filename = newFilename
                    return this.upload(sid, fileObj, distDir, cancel)
                }
            }
            
            // No conflict, proceed with upload
            return this.upload(sid, fileObj, distDir, cancel)
        } catch (err) {
            throw err
        }
    }

    createFile(sid, dir, file) {
        // Extract relative path for nested folder uploads
        // When uploading folders, the file object contains webkitRelativePath
        let relPath = ''
        if (file.webkitRelativePath) {
            // webkitRelativePath includes the root folder name, so we need to extract subdirectories
            // E.g., "myFolder/subfolder/file.txt" -> relPath="subfolder"
            const pathParts = file.webkitRelativePath.split('/')
            if (pathParts.length > 2) {
                // Join all parts except the first (root folder) and last (filename)
                relPath = pathParts.slice(1, -1).join('/')
            }
        }

        const matter = { 
            sid: sid, 
            name: file.name, 
            type: file.type, 
            size: file.size, 
            dir: dir,
            rel_path: relPath
        }
        return axios.post('/matters', matter)
    }

    // Check if a file with the same name already exists in the directory
    checkExistingFile(sid, dir, filename) {
        return new Promise((resolve, reject) => {
            axios.get('/matters', { 
                params: { 
                    sid: sid, 
                    dir: dir, 
                    kw: filename  // Search by filename
                } 
            }).then(ret => {
                const existing = ret.data.list.find(item => item.name === filename)
                resolve(existing || null)
            }).catch(reject)
        })
    }

    createFolder(sid, name, parent) {
        const matter = { sid: sid, name: name, dir: parent, is_dir: true }
        return axios.post('/matters', matter)
    }

    uploadDone(alias) {
        return axios.patch(`/matters/${alias}/done`)
    }

    get(alias) {
        return new Promise((resolve, reject) => {
            axios.get(`/matters/${alias}`).then(ret => {
                resolve(ret.data)
            }).catch(reject)
        })
    }

    download(alias) {
        return new Promise((resolve, reject) => {
            this.get(alias).then(ret => {
                utils.download(ret.name, ret.url).then(() => {
                    resolve(ret)
                }).catch(reject)
            })
        })
    }

    list(params) {
        return new Promise((resolve, reject) => {
            axios.get('/matters', { params: params }).then(ret => {
                let data = ret.data
                data.list = data.list.map(item => {
                    item.size = utils.formatBytes(item.size, 1);
                    item.fullpath = `${item.parent}${item.name}`
                    if (item.dirtype) item.fullpath += '/'
                    return item
                })
                resolve(data);
            }).catch(reject)
        })
    }

    rename(alias, name) {
        return axios.patch(`/matters/${alias}/name`, { name: name })
    }

    move(alias, newDir) {
        return axios.patch(`/matters/${alias}/location`, { dir: newDir })
    }

    copy(alias, newPath) {
        return axios.patch(`/matters/${alias}/duplicate`, { path: newPath })
    }

    delete(alias) {
        return axios.delete(`/matters/${alias}`)
    }
}

export default zMatter;
