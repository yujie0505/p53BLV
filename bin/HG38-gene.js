'use strict'

const fs = require('fs'), mongo = require('../lib/mongo.js'), request = require('request')

// global variables (with default values)

const opt = {
  chr_whitelist: `^(${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 'X', 'Y', 'MT'].join('|')})$`,
  collection_name: 'gene',
  crawler: {
    maximum_retry  : 10,
    retry_interval : 10000 // 10 seconds
  },
  path: {
    ref : '../ref',
    src : '../src'
  },
  promoter_offset: 10000,
  redirection_list: {
    FAM95C : 'http://asia.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=ENSG00000283486;r=9:38540569-38577207',
    OR8S1  : 'http://asia.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=ENSG00000284723;r=12:48525632-48528103'
  }
}

// utility

const crawler = url => {
  return new Promise((resolve, reject) => {
    request(url, (err, res, body) => err ? reject(err) : resolve(body))
  })
}

const getGeneInfo = async (gene_info, url, retry=0) => {
  let body, match

  try {
    body = await crawler(url)
    match = body.match(/Description<.*?<p>(.*?)<\/p>(?:.*?Synonyms<.*?<p>(.*?)<\/p>)?/)

    if (!match)
      throw new Error('Regex matching failed...')

  } catch (err) {
    if (retry === opt.crawler.maximum_retry)
      return console.log(err.stack)

    return setTimeout(() => getGeneInfo(gene_info, url, ++retry), opt.crawler.retry_interval)
  }

  gene_info.description = match[1].replace(/<.*?>/g, ''),
  gene_info.synonyms    = match[2] || ''
}

///////////////////////////////////////////////////////////////////////////////////////

const list_uni = {}

for (let record of fs.readFileSync(`${opt.path.src}/biomart_export_hg38genelist.txt`, 'utf-8').split('\n').slice(1, -1)) {
  let data = record.split(',')

  let info = {
    gene_id                  : data[0],
    transcript_id            : data[1],
    chr_name                 : data[2],
    transcript_start         : parseInt(data[3]),
    transcript_end           : parseInt(data[4]),
    transcription_start_site : parseInt(data[5]),
    strand                   : data[6],
    NCBI_gene_id             : data[7],
    HGNC_symbol              : data[8],
    gene_name                : data[9],
    transcript_name          : data[10]
  }
  info.promoter = {
    start : info.transcription_start_site - opt.promoter_offset,
    end   : info.transcription_start_site + opt.promoter_offset
  }
  info.transcript_length = info.transcript_end - info.transcript_start

  if (!info.NCBI_gene_id.length || !info.HGNC_symbol.length || !info.chr_name.match(opt.chr_whitelist))
    continue

  else if (!list_uni[info.gene_name] || list_uni[info.gene_name].transcript_length < info.transcript_length)
    list_uni[info.gene_name] = info
}

Promise.all(Object.keys(list_uni).map(async gene => {
  let info = list_uni[gene]

  await getGeneInfo(info, (opt.redirection_list[gene] || `http://asia.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=${info.gene_id};r=${info.chr_name}:${info.transcript_start}-${info.transcript_end};t=${info.transcript_id}`))

  return info

})).then(async data => {
  if (await mongo.insert(opt.collection_name, data))
    throw new Error('Failed in MongoDB insertion...')

  if (await mongo.setIndex(opt.collection_name, { gene_name: 1 }))
    throw new Error('Failed in MongoDB collection index creation...')

}).catch(err => console.log(err.stack))
