require! <[fs]>

peak-list = {}

for dataset in fs.readdir-sync \../res/ChIP-Seq/
  peak-list[dataset] = []

  for record in (fs.read-file-sync "../res/ChIP-Seq/#dataset/p53file/peaks.txt" \utf-8) / \\n
    continue if not record.length or record is /^#/

    data = record / \\t

    peak =
      peak-id                : data.0
      chr                    : data.1
      start                  : parseInt data.2
      end                    : parseInt data.3
      strand                 : data.4
      normalized-tag-count   : data.5
      focus-ratio            : data.6
      find-peaks-score       : data.7

    if 15 is data.length
      peak <<< do
        total-tags             : data.8
        control-tags           : data.9
        fold-change-vs-control : data.10
        p-value-vs-control     : data.11
        fold-change-vs-local   : data.12
        p-value-vs-local       : data.13
        clonal-fold-change     : data.14

    else if 11 is data.length
      peak <<< do
        fold-change-vs-local   : data.8
        p-value-vs-local       : data.9
        clonal-fold-change     : data.10

    else throw 'fail to mapping column information'

    peak-list[dataset].push peak

fs.write-file-sync \../res/ref/peak-list.json JSON.stringify peak-list, null 2
