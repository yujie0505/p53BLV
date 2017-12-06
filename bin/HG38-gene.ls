require! <[fs]>

list-raw = fs.read-file-sync \../src/biomart_export_hg38genelist.txt \utf-8
list-uni = {}

chr-whitelist = "^(#{<[1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 X Y MT]> * \|})$"

for record in (list-raw / \\n).slice 1 -1
  data = record / \,

  gene =
    gene-stable-id           : data[0]
    transcript-stable-id     : data[1]
    chromosome-name          : data[2]
    transcript-start         : parseInt data[3]
    transcript-end           : parseInt data[4]
    transcription-start-site : parseInt data[5]
    strand                   : data[6]
    NCBI-gene-id             : data[7]
    HGNC-symbol              : data[8]
    gene-name                : data[9]
    transcript-name          : data[10]
  gene.transcript-length = gene.transcript-end - gene.transcript-start

  continue if not gene.NCBI-gene-id.length or not gene.HGNC-symbol.length or not gene.chromosome-name.match chr-whitelist

  list-uni[gene.gene-name] = gene if not list-uni[gene.gene-name] or list-uni[gene.gene-name].transcript-length < gene.transcript-length

fs.write-file-sync \../res/ref/gene-list.json JSON.stringify list-uni, null 2
