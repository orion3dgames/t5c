function apply(src, tar) {
	tar.statusMessage = src.statusText;
	tar.statusCode = src.status;
	tar.data = src.body;
}

function send(method, uri, opts) {
	opts = opts || {};
	var timer, ctrl, tmp=opts.body;

	opts.method = method;
	opts.headers = opts.headers || {};

	if (tmp instanceof FormData) {
		// leave it
	} else if (tmp && typeof tmp == 'object') {
		opts.headers['content-type'] = 'application/json';
		opts.body = JSON.stringify(tmp);
	}

	if (opts.withCredentials) {
		opts.credentials = 'include';
	}

	if (opts.timeout) {
		ctrl = new AbortController;
		opts.signal = ctrl.signal;
		timer = setTimeout(ctrl.abort, opts.timeout);
	}

	return new Promise((res, rej) => {
		fetch(uri, opts).then((rr, reply) => {
			clearTimeout(timer);

			apply(rr, rr); //=> rr.headers
			reply = rr.status >= 400 ? rej : res;

			tmp = rr.headers.get('content-type');
			if (!tmp || !~tmp.indexOf('application/json')) {
				reply(rr);
			} else {
				rr.text().then(str => {
					try {
						rr.data = JSON.parse(str, opts.reviver);
						reply(rr);
					} catch (err) {
						err.headers = rr.headers;
						apply(rr, err);
						rej(err);
					}
				});
			}
		}).catch(err => {
			err.timeout = ctrl && ctrl.signal.aborted;
			rej(err);
		});
	});
}

var get = /*#__PURE__*/ send.bind(send, 'GET');
var post = /*#__PURE__*/ send.bind(send, 'POST');
var patch = /*#__PURE__*/ send.bind(send, 'PATCH');
var del = /*#__PURE__*/ send.bind(send, 'DELETE');
var put = /*#__PURE__*/ send.bind(send, 'PUT');

exports.del = del;
exports.get = get;
exports.patch = patch;
exports.post = post;
exports.put = put;
exports.send = send;