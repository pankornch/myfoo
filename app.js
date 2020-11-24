const express = require('express');
const app = express();
const request = require('request');
const cheerio = require('cheerio');
const mongoose = require('mongoose')

mongoose.connect('mongodb+srv://admin:root@cluster0.yarcc.mongodb.net/students?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, () => console.log('Database connected!!'))

// app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('views', './views')
app.set('view engine', 'ejs')


const User = mongoose.model('students', new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    major: {
        type: String,
        required: true
    },
    program: {
        type: String,
        required: true
    },
    createAt: {
        type: Date,
        required: true
    }
}))


app.get('/', (req, res) => {
    return res.render('index', { data: null })
})


app.post('/', (req, res) => {
    var options = {
        'method': 'POST',
        'url': 'https://www.upsearching.com/',
        formData: {
            'userid': req.body.userid,
            'submit': ''
        }
    };
    request.defaults({
        jar: true,
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0"
        },
    })
    request(options, async function (error, response, html) {
        if (error) throw new Error(error);
        const $ = cheerio.load(html, {
            xmlMode: false,
            normalizeWhitespace: false,
            decodeEntities: true
        })
        let user = [];
        $('td').each(function (i, el) {
            if (i > 3) user.push(this.children[0].data)
        })
        const jsonText = JSON.stringify(html)
        const start = jsonText.indexOf('สังกัด : ')
        const end = jsonText.slice(start).indexOf('";')
        const result = jsonText.slice(start, start + end);
        const replacer = result.replace(/สังกัด/, '').replace(/[:\\]/g, '')
        const [member, num] = replacer.split(' ').filter(e => !!e)

        const doc = new User({ name: 'fooName', major: 'fooMajor', program: "fooProgram", createAt: Date.now() })
        await doc.save()
        res.render('index', { data: { member, num, user } })
    });
})

app.get('/admin', async (req, res) => {
    const users = await User.find({})
    res.render('admin', { users })
})

app.get('/confirm/:query', async (req, res) => {
    const { query } = req.params
    const keys = query.split('&')
    const d = keys.map(e => {
        const [k, data] = e.split('=');
        return data
    })
    const doc = new User({ userid: d[0], name: d[1], major: d[2], program: d[3] })
    await doc.save()
    res.redirect('/')
})

app.listen(5050, () => console.log('Server listening :: 5050'))